import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import {
    Badge,
    Box,
    Button,
    CssBaseline,
    IconButton,
    TextField,
    ThemeProvider,
    Typography,
    createTheme,
} from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import styles from "../styles/videoComponent.module.css";
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import server from "../enviroment.js";

const server_url = server;

/** Same file as `frontend/public/wallpaper.webp` (served from site root). */
const guestLobbyWallpaperUrl = `${process.env.PUBLIC_URL || ""}/wallpaper.webp`;

const guestLobbyTheme = createTheme({
    palette: {
        mode: "dark",
        background: {
            default: "#0f172a",
            paper: "#1f2937",
        },
    },
});

const guestLobbyTextFieldSx = {
    "& .MuiOutlinedInput-root": {
        borderRadius: "14px",
        background: "rgba(255,255,255,0.05)",
        color: "white",
        "& fieldset": {
            borderColor: "rgba(255,255,255,0.1)",
        },
        "&:hover fieldset": {
            borderColor: "#7c3aed",
        },
        "&.Mui-focused fieldset": {
            borderColor: "#7c3aed",
        },
    },
    "& .MuiInputLabel-root": {
        color: "rgba(255,255,255,0.7)",
    },
    "& .MuiInputLabel-root.Mui-focused": {
        color: "#a78bfa",
    },
};

var connections = {};

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

export default function VideoMeetComponent() {

    var socketRef = useRef();
    let socketIdRef = useRef();

    let localVideoref = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);

    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState(undefined);

    let [audio, setAudio] = useState(undefined);

    /** Last chosen mic/camera on/off (used after screen share ends; avoids stale React state in callbacks). */
    const mediaPrefsRef = useRef({ video: true, audio: true });

    let [screen, setScreen] = useState();

    let [showModal, setModal] = useState(true);

    let [screenAvailable, setScreenAvailable] = useState();

    let [messages, setMessages] = useState([])

    let [message, setMessage] = useState("");

    let [newMessages, setNewMessages] = useState(3);

    let [askForUsername, setAskForUsername] = useState(true);

    let [username, setUsername] = useState("");

    const videoRef = useRef([])

    let [videos, setVideos] = useState([])

    // TODO
    // if(isChrome() === false) {


    // }

    useEffect(() => {
        getPermissions();
    }, [])

    let getDislayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDislayMediaSuccess)
                    .then((stream) => { })
                    .catch((e) => console.log(e))
            }
        }
    }

    const getPermissions = async () => {
        try {
            let videoOk = false
            let audioOk = false

            try {
                const videoProbe = await navigator.mediaDevices.getUserMedia({ video: true });
                videoOk = true
                videoProbe.getTracks().forEach((t) => t.stop())
                setVideoAvailable(true)
                console.log('Video permission granted')
            } catch {
                setVideoAvailable(false)
                console.log('Video permission denied')
            }

            try {
                const audioProbe = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioOk = true
                audioProbe.getTracks().forEach((t) => t.stop())
                setAudioAvailable(true)
                console.log('Audio permission granted')
            } catch {
                setAudioAvailable(false)
                console.log('Audio permission denied')
            }

            setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia)

            if (videoOk || audioOk) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoOk, audio: audioOk });
                if (userMediaStream) {
                    try {
                        window.localStream?.getTracks().forEach((t) => t.stop())
                    } catch (e) { console.log(e) }
                    window.localStream = userMediaStream;
                    if (localVideoref.current) {
                        localVideoref.current.srcObject = userMediaStream;
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }
    };

    const renegotiatePeers = () => {
        if (!socketRef.current) return
        for (let id in connections) {
            if (id === socketIdRef.current) continue
            const pc = connections[id]
            try {
                pc.addStream(window.localStream)
            } catch (e) { console.log(e) }
            pc.createOffer().then((description) => {
                pc.setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': pc.localDescription }))
                    })
                    .catch(e => console.log(e))
            }).catch(e => console.log(e))
        }
    }

    let getMedia = () => {
        const v = videoAvailable
        const a = audioAvailable
        mediaPrefsRef.current = { video: v, audio: a }
        setVideo(v)
        setAudio(a)
        navigator.mediaDevices.getUserMedia({ video: v, audio: a })
            .then((stream) => {
                getUserMediaSuccess(stream)
                connectToSocketServer()
            })
            .catch((e) => console.log(e))
    }




    let getUserMediaSuccess = (stream) => {
        try {
            window.localStream?.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        if (localVideoref.current) {
            localVideoref.current.srcObject = stream
        }

        renegotiatePeers()

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);
            mediaPrefsRef.current = { video: false, audio: false }

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            renegotiatePeers()
        })
    }





    let getDislayMediaSuccess = (stream) => {
        console.log("HERE")
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false)

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            const prefs = mediaPrefsRef.current
            navigator.mediaDevices.getUserMedia({
                video: prefs.video && videoAvailable,
                audio: prefs.audio && audioAvailable,
            })
                .then((s) => {
                    getUserMediaSuccess(s)
                })
                .catch((e) => {
                    console.log(e)
                    let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                    window.localStream = blackSilence()
                    localVideoref.current.srcObject = window.localStream
                    renegotiatePeers()
                })

        })
    }

    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }

            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
            }
        }
    }




    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false })

        socketRef.current.on('signal', gotMessageFromServer)

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href)
            socketIdRef.current = socketRef.current.id

            socketRef.current.on('chat-message', addMessage)

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
            })

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
                    // Wait for their ice candidate       
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    // Wait for their video stream
                    connections[socketListId].onaddstream = (event) => {
                        console.log("BEFORE:", videoRef.current);
                        console.log("FINDING ID: ", socketListId);

                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                        if (videoExists) {
                            console.log("FOUND EXISTING");

                            // Update the stream of the existing video
                            setVideos(videos => {
                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: event.stream } : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        } else {
                            // Create a new video
                            console.log("CREATING NEW");
                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoplay: true,
                                playsinline: true
                            };

                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };


                    // Add the local video stream
                    if (window.localStream !== undefined && window.localStream !== null) {
                        connections[socketListId].addStream(window.localStream)
                    } else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                        window.localStream = blackSilence()
                        connections[socketListId].addStream(window.localStream)
                    }
                })

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue

                        try {
                            connections[id2].addStream(window.localStream)
                        } catch (e) { }

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
                                })
                                .catch(e => console.log(e))
                        })
                    }
                }
            })
        })
    }

    let silence = () => {
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator()
        let dst = oscillator.connect(ctx.createMediaStreamDestination())
        oscillator.start()
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
    }
    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height })
        canvas.getContext('2d').fillRect(0, 0, width, height)
        let stream = canvas.captureStream()
        return Object.assign(stream.getVideoTracks()[0], { enabled: false })
    }

    let handleVideo = () => {
        const stream = window.localStream
        if (!stream) return
        const wantOn = !video
        if (wantOn && !videoAvailable) return
        mediaPrefsRef.current = { ...mediaPrefsRef.current, video: wantOn }
        const tracks = stream.getVideoTracks()
        if (tracks.length > 0) {
            tracks.forEach((t) => { t.enabled = wantOn })
            setVideo(wantOn)
            return
        }
        if (wantOn) {
            navigator.mediaDevices.getUserMedia({ video: true, audio: false })
                .then((vStream) => {
                    vStream.getTracks().forEach((t) => {
                        if (t.kind === 'video') stream.addTrack(t)
                        else t.stop()
                    })
                    setVideo(true)
                    renegotiatePeers()
                })
                .catch((e) => console.log(e))
        } else {
            setVideo(false)
        }
    }
    let handleAudio = () => {
        const stream = window.localStream
        if (!stream) return
        const wantOn = !audio
        if (wantOn && !audioAvailable) return
        mediaPrefsRef.current = { ...mediaPrefsRef.current, audio: wantOn }
        const tracks = stream.getAudioTracks()
        if (tracks.length > 0) {
            tracks.forEach((t) => { t.enabled = wantOn })
            setAudio(wantOn)
            return
        }
        if (wantOn) {
            navigator.mediaDevices.getUserMedia({ video: false, audio: true })
                .then((aStream) => {
                    aStream.getTracks().forEach((t) => {
                        if (t.kind === 'audio') stream.addTrack(t)
                        else t.stop()
                    })
                    setAudio(true)
                    renegotiatePeers()
                })
                .catch((e) => console.log(e))
        } else {
            setAudio(false)
        }
    }

    useEffect(() => {
        if (screen !== undefined) {
            getDislayMedia();
        }
    }, [screen])
    let handleScreen = () => {
        setScreen(!screen);
    }

    let handleEndCall = () => {
        try {
            let tracks = localVideoref.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
        } catch (e) { }
        window.location.href = "/"
    }

    let openChat = () => {
        setModal(true);
        setNewMessages(0);
    }
    let closeChat = () => {
        setModal(false);
    }
    let handleMessage = (e) => {
        setMessage(e.target.value);
    }

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
        }
    };



    let sendMessage = () => {
        console.log(socketRef.current);
        socketRef.current.emit('chat-message', message, username)
        setMessage("");

        // this.setState({ message: "", sender: username })
    }

    
    let connect = () => {
        setAskForUsername(false);
        getMedia();
    }


    return (
        <div>

            {askForUsername === true ? (
                <ThemeProvider theme={guestLobbyTheme}>
                    <CssBaseline />
                    <Box
                        component="main"
                        sx={{
                            position: "relative",
                            minHeight: "100vh",
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            p: { xs: 2, sm: 3 },
                            boxSizing: "border-box",
                            overflow: "auto",
                        }}
                    >
                        <Box
                            aria-hidden
                            sx={{
                                position: "fixed",
                                inset: 0,
                                zIndex: 0,
                                backgroundColor: "rgb(15, 23, 42)",
                                backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.88), rgba(30, 41, 59, 0.82)), url(${guestLobbyWallpaperUrl})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                backgroundRepeat: "no-repeat",
                            }}
                        />
                        <Box
                            sx={{
                                position: "relative",
                                zIndex: 1,
                                width: "100%",
                                maxWidth: 400,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "stretch",
                                gap: 2,
                                p: { xs: 3.5, sm: 4.5 },
                                borderRadius: "22px",
                                background: "#1f2937",
                                backdropFilter: "blur(18px)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
                            }}
                        >
                                <Typography
                                    variant="h5"
                                    sx={{
                                        fontWeight: "bold",
                                        fontSize: "1.35rem",
                                        color: "white",
                                        textAlign: "center",
                                    }}
                                >
                                    Join as guest
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: "rgba(255,255,255,0.65)",
                                        textAlign: "center",
                                        mt: -0.5,
                                    }}
                                >
                                    Enter a display name, then connect to the room.
                                </Typography>
                                <TextField
                                    margin="normal"
                                    fullWidth
                                    label="Display name"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    variant="outlined"
                                    autoComplete="nickname"
                                    sx={guestLobbyTextFieldSx}
                                />
                                <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={connect}
                                    disabled={!username.trim()}
                                    sx={{
                                        py: 1.25,
                                        borderRadius: "14px",
                                        fontWeight: "bold",
                                        fontSize: "0.95rem",
                                        textTransform: "none",
                                        background:
                                            "linear-gradient(90deg,#7c3aed,#2563eb)",
                                        "&:hover": {
                                            background:
                                                "linear-gradient(90deg,#6d28d9,#1d4ed8)",
                                        },
                                        "&.Mui-disabled": {
                                            background: "rgba(255,255,255,0.12)",
                                            color: "rgba(255,255,255,0.35)",
                                        },
                                    }}
                                >
                                    Connect
                                </Button>
                                <Box
                                    sx={{
                                        borderRadius: "14px",
                                        overflow: "hidden",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        background: "#0f172a",
                                        aspectRatio: "16 / 10",
                                        maxHeight: 220,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <video
                                        ref={localVideoref}
                                        autoPlay
                                        muted
                                        playsInline
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                    />
                                </Box>
                        </Box>
                    </Box>
                </ThemeProvider>
            ) : (


                <div className={styles.meetVideoContainer}>

                    {showModal ? <div className={styles.chatRoom}>

                        <div className={styles.chatContainer}>
                            <h1>Chat</h1>

                            <div className={styles.chattingDisplay}>

                                {messages.length !== 0 ? messages.map((item, index) => {

                                    console.log(messages)
                                    return (
                                        <div style={{ marginBottom: "20px" }} key={index}>
                                            <p style={{ fontWeight: "bold" }}>{item.sender}</p>
                                            <p>{item.data}</p>
                                        </div>
                                    )
                                }) : <p>No Messages Yet</p>}


                            </div>

                            <div className={styles.chattingArea}>
                                <TextField value={message} onChange={(e) => setMessage(e.target.value)} id="outlined-basic" label="Enter Your chat" variant="outlined" />
                                <Button variant='contained' onClick={sendMessage}>Send</Button>
                            </div>


                        </div>
                    </div> : <></>}


                    <div className={styles.buttonContainers}>
                        <IconButton onClick={handleVideo} style={{ color: "white" }}>
                            {(video === true) ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>
                        <IconButton onClick={handleEndCall} style={{ color: "red" }}>
                            <CallEndIcon  />
                        </IconButton>
                        <IconButton onClick={handleAudio} style={{ color: "white" }}>
                            {audio === true ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>

                        {screenAvailable === true ?
                            <IconButton onClick={handleScreen} style={{ color: "white" }}>
                                {screen === true ? <ScreenShareIcon /> : <StopScreenShareIcon />}
                            </IconButton> : <></>}

                        <Badge badgeContent={newMessages} max={999} color='orange'>
                            <IconButton onClick={() => setModal(!showModal)} style={{ color: "white" }}>
                                <ChatIcon />                        </IconButton>
                        </Badge>

                    </div>


                    <video className={styles.meetUserVideo} ref={localVideoref} autoPlay muted></video>

                    <div className={styles.conferenceView}>
                        {videos.map((video) => (
                            <div key={video.socketId}>
                                <video

                                    data-socket={video.socketId}
                                    ref={ref => {
                                        if (ref && video.stream) {
                                            ref.srcObject = video.stream;
                                        }
                                    }}
                                    autoPlay
                                >
                                </video>
                            </div>

                        ))}

                    </div>

                </div>

            )}

        </div>
    )
}