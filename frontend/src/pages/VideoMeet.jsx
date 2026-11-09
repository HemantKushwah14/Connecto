import React, { useEffect, useRef, useState } from 'react';
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
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import styles from "../styles/videoComponent.module.css";
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import server from "../enviroment.js";

const server_url = server;

/** Same file as `frontend/public/wallpaper.webp` (served from site root). */
const guestLobbyWallpaperUrl = `${process.env.PUBLIC_URL || ""}/wallpaper.webp`;

const guestLobbyTheme = createTheme({
    palette: {
        mode: "dark",
        background: {
            default: "#0d0e12",
            paper: "#181920",
        },
    },
});

const guestLobbyTextFieldSx = {
    "& .MuiOutlinedInput-root": {
        borderRadius: "14px",
        background: "rgba(255,255,255,0.05)",
        color: "white",
        "& fieldset": {
            borderColor: "rgba(255,255,255,0.12)",
        },
        "&:hover fieldset": {
            borderColor: "#7c3aed",
        },
        "&.Mui-focused fieldset": {
            borderColor: "#a855f7",
        },
    },
    "& .MuiInputLabel-root": {
        color: "rgba(255,255,255,0.7)",
    },
    "& .MuiInputLabel-root.Mui-focused": {
        color: "#c084fc",
    },
};

var connections = {};

const peerConfigConnections = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
    ]
};

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

    let [showModal, setModal] = useState(false);

    let [screenAvailable, setScreenAvailable] = useState();

    let [messages, setMessages] = useState([]);

    let [message, setMessage] = useState("");

    let [newMessages, setNewMessages] = useState(0);

    let [askForUsername, setAskForUsername] = useState(true);

    let [username, setUsername] = useState("");

    let [copied, setCopied] = useState(false);

    const videoRef = useRef([]);

    let [videos, setVideos] = useState([]);

    useEffect(() => {
        getPermissions();
    }, []);

    // Ensure local stream is bound to current video element
    useEffect(() => {
        if (localVideoref.current && window.localStream) {
            localVideoref.current.srcObject = window.localStream;
        }
    }, [videos.length, askForUsername]);

    let getDisplayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDisplayMediaSuccess)
                    .then((stream) => { })
                    .catch((e) => console.log(e));
            }
        }
    };

    const getPermissions = async () => {
        try {
            let videoOk = false;
            let audioOk = false;

            try {
                const videoProbe = await navigator.mediaDevices.getUserMedia({ video: true });
                videoOk = true;
                videoProbe.getTracks().forEach((t) => t.stop());
                setVideoAvailable(true);
                console.log('Video permission granted');
            } catch {
                setVideoAvailable(false);
                console.log('Video permission denied');
            }

            try {
                const audioProbe = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioOk = true;
                audioProbe.getTracks().forEach((t) => t.stop());
                setAudioAvailable(true);
                console.log('Audio permission granted');
            } catch {
                setAudioAvailable(false);
                console.log('Audio permission denied');
            }

            setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);

            if (videoOk || audioOk) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoOk, audio: audioOk });
                if (userMediaStream) {
                    try {
                        window.localStream?.getTracks().forEach((t) => t.stop());
                    } catch (e) { console.log(e); }
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
        if (!socketRef.current) return;
        for (let id in connections) {
            if (id === socketIdRef.current) continue;
            const pc = connections[id];
            try {
                pc.addStream(window.localStream);
            } catch (e) { console.log(e); }
            pc.createOffer().then((description) => {
                pc.setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': pc.localDescription }));
                    })
                    .catch(e => console.log(e));
            }).catch(e => console.log(e));
        }
    };

    let getMedia = () => {
        const v = videoAvailable;
        const a = audioAvailable;
        mediaPrefsRef.current = { video: v, audio: a };
        setVideo(v);
        setAudio(a);
        navigator.mediaDevices.getUserMedia({ video: v, audio: a })
            .then((stream) => {
                getUserMediaSuccess(stream);
                connectToSocketServer();
            })
            .catch((e) => console.log(e));
    };

    let getUserMediaSuccess = (stream) => {
        try {
            window.localStream?.getTracks().forEach(track => track.stop());
        } catch (e) { console.log(e); }

        window.localStream = stream;
        if (localVideoref.current) {
            localVideoref.current.srcObject = stream;
        }

        renegotiatePeers();

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);
            mediaPrefsRef.current = { video: false, audio: false };

            try {
                let tracks = localVideoref.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            } catch (e) { console.log(e); }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            if (localVideoref.current) {
                localVideoref.current.srcObject = window.localStream;
            }

            renegotiatePeers();
        });
    };

    let getDisplayMediaSuccess = (stream) => {
        console.log("HERE");
        try {
            window.localStream.getTracks().forEach(track => track.stop());
        } catch (e) { console.log(e); }

        window.localStream = stream;
        if (localVideoref.current) {
            localVideoref.current.srcObject = stream;
        }

        for (let id in connections) {
            if (id === socketIdRef.current) continue;

            connections[id].addStream(window.localStream);

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }));
                    })
                    .catch(e => console.log(e));
            });
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false);

            try {
                let tracks = localVideoref.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            } catch (e) { console.log(e); }

            const prefs = mediaPrefsRef.current;
            navigator.mediaDevices.getUserMedia({
                video: prefs.video && videoAvailable,
                audio: prefs.audio && audioAvailable,
            })
                .then((s) => {
                    getUserMediaSuccess(s);
                })
                .catch((e) => {
                    console.log(e);
                    let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                    window.localStream = blackSilence();
                    if (localVideoref.current) {
                        localVideoref.current.srcObject = window.localStream;
                    }
                    renegotiatePeers();
                });
        });
    };

    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message);

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }));
                            }).catch(e => console.log(e));
                        }).catch(e => console.log(e));
                    }
                }).catch(e => console.log(e));
            }

            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e));
            }
        }
    };

    let connectToSocketServer = () => {
        const isSecure = server_url.startsWith("https");
        socketRef.current = io(server_url, {
            secure: isSecure,
            transports: ["websocket", "polling"]
        });

        socketRef.current.on('signal', gotMessageFromServer);

        socketRef.current.on('connect', () => {
            const roomKey = window.location.pathname || window.location.href;
            socketRef.current.emit('join-call', roomKey);
            socketIdRef.current = socketRef.current.id;

            socketRef.current.on('chat-message', addMessage);

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id));
            });

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections);
                    // Wait for their ice candidate       
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }));
                        }
                    };

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
                        connections[socketListId].addStream(window.localStream);
                    } else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                        window.localStream = blackSilence();
                        connections[socketListId].addStream(window.localStream);
                    }
                });

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue;

                        try {
                            connections[id2].addStream(window.localStream);
                        } catch (e) { }

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }));
                                })
                                .catch(e => console.log(e));
                        });
                    }
                }
            });
        });
    };

    let silence = () => {
        let ctx = new AudioContext();
        let oscillator = ctx.createOscillator();
        let dst = oscillator.connect(ctx.createMediaStreamDestination());
        oscillator.start();
        ctx.resume();
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
    };

    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height });
        canvas.getContext('2d').fillRect(0, 0, width, height);
        let stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], { enabled: false });
    };

    let handleVideo = () => {
        const stream = window.localStream;
        if (!stream) return;
        const wantOn = !video;
        if (wantOn && !videoAvailable) return;
        mediaPrefsRef.current = { ...mediaPrefsRef.current, video: wantOn };
        const tracks = stream.getVideoTracks();
        if (tracks.length > 0) {
            tracks.forEach((t) => { t.enabled = wantOn; });
            setVideo(wantOn);
            return;
        }
        if (wantOn) {
            navigator.mediaDevices.getUserMedia({ video: true, audio: false })
                .then((vStream) => {
                    vStream.getTracks().forEach((t) => {
                        if (t.kind === 'video') stream.addTrack(t);
                        else t.stop();
                    });
                    setVideo(true);
                    renegotiatePeers();
                })
                .catch((e) => console.log(e));
        } else {
            setVideo(false);
        }
    };

    let handleAudio = () => {
        const stream = window.localStream;
        if (!stream) return;
        const wantOn = !audio;
        if (wantOn && !audioAvailable) return;
        mediaPrefsRef.current = { ...mediaPrefsRef.current, audio: wantOn };
        const tracks = stream.getAudioTracks();
        if (tracks.length > 0) {
            tracks.forEach((t) => { t.enabled = wantOn; });
            setAudio(wantOn);
            return;
        }
        if (wantOn) {
            navigator.mediaDevices.getUserMedia({ video: false, audio: true })
                .then((aStream) => {
                    aStream.getTracks().forEach((t) => {
                        if (t.kind === 'audio') stream.addTrack(t);
                        else t.stop();
                    });
                    setAudio(true);
                    renegotiatePeers();
                })
                .catch((e) => console.log(e));
        } else {
            setAudio(false);
        }
    };

    useEffect(() => {
        if (screen !== undefined) {
            getDisplayMedia();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [screen]);

    let handleScreen = () => {
        setScreen(!screen);
    };

    let handleEndCall = () => {
        try {
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        } catch (e) { }
        window.location.href = "/";
    };

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
        if (!message.trim()) return;
        socketRef.current.emit('chat-message', message, username);
        setMessage("");
    };

    let connect = () => {
        setAskForUsername(false);
        getMedia();
    };

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
                                backgroundColor: "#0d0e12",
                                backgroundImage: `linear-gradient(to right, rgba(13, 14, 18, 0.92), rgba(24, 25, 32, 0.88)), url(${guestLobbyWallpaperUrl})`,
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
                                background: "#181920",
                                backdropFilter: "blur(18px)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
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
                                Join Room
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: "rgba(255,255,255,0.65)",
                                    textAlign: "center",
                                    mt: -0.5,
                                }}
                            >
                                Enter your display name to start or join the call.
                            </Typography>
                            <TextField
                                margin="normal"
                                fullWidth
                                label="Display name"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                variant="outlined"
                                autoComplete="nickname"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && username.trim()) connect();
                                }}
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
                                    background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                                    boxShadow: "0 4px 16px rgba(124, 58, 237, 0.4)",
                                    "&:hover": {
                                        background: "linear-gradient(135deg, #6d28d9, #9333ea)",
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
                                    background: "#111217",
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
                    {/* Chat Drawer (Top-Right: completely separated from Bottom-Left user video) */}
                    {showModal ? (
                        <div className={styles.chatRoom}>
                            <div className={styles.chatContainer}>
                                <div className={styles.chatHeader}>
                                    <h2>Meeting Chat</h2>
                                    <IconButton
                                        onClick={() => setModal(false)}
                                        size="small"
                                        sx={{ color: "rgba(255, 255, 255, 0.7)", "&:hover": { color: "#ffffff" } }}
                                    >
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                </div>

                                <div className={styles.chattingDisplay}>
                                    {messages.length !== 0 ? (
                                        messages.map((item, index) => (
                                            <div className={styles.chatMessage} key={index}>
                                                <p className={styles.chatSender}>{item.sender}</p>
                                                <p className={styles.chatText}>{item.data}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className={styles.noMessages}>No Messages Yet</p>
                                    )}
                                </div>

                                <div className={styles.chattingArea}>
                                    <TextField
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        variant="outlined"
                                        size="small"
                                        fullWidth
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") sendMessage();
                                        }}
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                borderRadius: "12px",
                                                background: "rgba(255, 255, 255, 0.06)",
                                                color: "white",
                                                "& fieldset": {
                                                    borderColor: "rgba(255, 255, 255, 0.12)",
                                                },
                                                "&:hover fieldset": {
                                                    borderColor: "#7c3aed",
                                                },
                                                "&.Mui-focused fieldset": {
                                                    borderColor: "#a855f7",
                                                },
                                            },
                                        }}
                                    />
                                    <Button
                                        variant="contained"
                                        onClick={sendMessage}
                                        sx={{
                                            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                                            borderRadius: "12px",
                                            fontWeight: "600",
                                            textTransform: "none",
                                            boxShadow: "0 4px 12px rgba(124, 58, 237, 0.35)",
                                            "&:hover": {
                                                background: "linear-gradient(135deg, #6d28d9, #9333ea)",
                                            },
                                        }}
                                    >
                                        Send
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {/* Bottom Controls Bar (Centered horizontally at the bottom) */}
                    <div className={styles.buttonContainers}>
                        <IconButton
                            onClick={handleVideo}
                            sx={{
                                color: "white",
                                background: video ? "rgba(255, 255, 255, 0.08)" : "rgba(239, 68, 68, 0.2)",
                                "&:hover": {
                                    background: video ? "rgba(255, 255, 255, 0.16)" : "rgba(239, 68, 68, 0.35)",
                                },
                            }}
                        >
                            {video === true ? <VideocamIcon /> : <VideocamOffIcon sx={{ color: "#ef4444" }} />}
                        </IconButton>

                        <IconButton
                            onClick={handleEndCall}
                            sx={{
                                background: "rgba(239, 68, 68, 0.9)",
                                color: "white",
                                "&:hover": {
                                    background: "#dc2626",
                                },
                            }}
                        >
                            <CallEndIcon />
                        </IconButton>

                        <IconButton
                            onClick={handleAudio}
                            sx={{
                                color: "white",
                                background: audio ? "rgba(255, 255, 255, 0.08)" : "rgba(239, 68, 68, 0.2)",
                                "&:hover": {
                                    background: audio ? "rgba(255, 255, 255, 0.16)" : "rgba(239, 68, 68, 0.35)",
                                },
                            }}
                        >
                            {audio === true ? <MicIcon /> : <MicOffIcon sx={{ color: "#ef4444" }} />}
                        </IconButton>

                        {screenAvailable === true ? (
                            <IconButton
                                onClick={handleScreen}
                                sx={{
                                    color: screen ? "#c084fc" : "white",
                                    background: screen ? "rgba(124, 58, 237, 0.25)" : "rgba(255, 255, 255, 0.08)",
                                    "&:hover": {
                                        background: screen ? "rgba(124, 58, 237, 0.35)" : "rgba(255, 255, 255, 0.16)",
                                    },
                                }}
                            >
                                {screen === true ? <ScreenShareIcon /> : <StopScreenShareIcon />}
                            </IconButton>
                        ) : null}

                        <Badge badgeContent={newMessages} max={999} color="secondary">
                            <IconButton
                                onClick={() => {
                                    setModal(!showModal);
                                    setNewMessages(0);
                                }}
                                sx={{
                                    color: showModal ? "#c084fc" : "white",
                                    background: showModal ? "rgba(124, 58, 237, 0.25)" : "rgba(255, 255, 255, 0.08)",
                                    "&:hover": {
                                        background: showModal ? "rgba(124, 58, 237, 0.35)" : "rgba(255, 255, 255, 0.16)",
                                    },
                                }}
                            >
                                <ChatIcon />
                            </IconButton>
                        </Badge>
                    </div>

                    {/* Main Video View: Separates solo vs multi-party */}
                    {videos.length === 0 ? (
                        <div className={`${styles.waitingContainer} ${showModal ? styles.waitingWithChat : ""}`}>
                            <div className={styles.mainSoloVideoWrapper}>
                                <video
                                    className={styles.mainSoloVideo}
                                    ref={localVideoref}
                                    autoPlay
                                    muted
                                    playsInline
                                />
                                <div className={styles.videoBadge}>You (Host)</div>
                            </div>
                            <div className={styles.inviteCard}>
                                <h3>Waiting for others to join...</h3>
                                <p>Share this meeting link so friends or colleagues can join your call</p>
                                <div className={styles.inviteLinkRow}>
                                    <span className={styles.inviteLinkText}>{window.location.href}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            navigator.clipboard.writeText(window.location.href);
                                            setCopied(true);
                                            setTimeout(() => setCopied(false), 2000);
                                        }}
                                        className={styles.copyButton}
                                    >
                                        {copied ? "Copied!" : "Copy Link"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Local Video PIP in Bottom-Left: will never overlap with Chat on the Right */}
                            <div className={styles.meetUserVideoWrapper}>
                                <video
                                    className={styles.meetUserVideo}
                                    ref={localVideoref}
                                    autoPlay
                                    muted
                                    playsInline
                                />
                                <div className={styles.videoBadge}>You</div>
                            </div>

                            {/* Remote Participants Grid */}
                            <div className={`${styles.conferenceView} ${showModal ? styles.conferenceWithChat : ""}`}>
                                {videos.map((video) => (
                                    <div className={styles.remoteVideoCard} key={video.socketId}>
                                        <video
                                            data-socket={video.socketId}
                                            ref={(ref) => {
                                                if (ref && video.stream) {
                                                    ref.srcObject = video.stream;
                                                }
                                            }}
                                            autoPlay
                                            playsInline
                                        />
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
