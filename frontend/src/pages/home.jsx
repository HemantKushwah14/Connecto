import React, { useContext, useState } from 'react';
import withAuth from '../utils/withAuth';
import { useNavigate } from 'react-router-dom';
import "../App.css";
import { Button, TextField } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import { AuthContext } from '../contexts/AuthContext';

function HomeComponent() {
    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const { addToUserHistory } = useContext(AuthContext);

    let handleJoinVideoCall = async () => {
        if (!meetingCode.trim()) return;
        await addToUserHistory(meetingCode);
        navigate(`/${meetingCode}`);
    };

    return (
        <>
            <div
                className="navBar"
                style={{
                    height: "80px",
                    padding: "0 40px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#111217",
                    color: "white",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                    }}
                >
                    <div
                        style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "12px",
                            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 4px 12px rgba(124, 58, 237, 0.35)",
                        }}
                    >
                        <VideoCallIcon style={{ color: "white", fontSize: "26px" }} />
                    </div>
                    <h2
                        style={{
                            fontSize: "26px",
                            fontWeight: "700",
                            margin: 0,
                            letterSpacing: "0.5px",
                            color: "#ffffff",
                        }}
                    >
                        Connecto
                    </h2>
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "24px",
                    }}
                >
                    <div
                        onClick={() => {
                            navigate("/history");
                        }}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            cursor: "pointer",
                            color: "#d4d4d8",
                            transition: "color 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#c084fc")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#d4d4d8")}
                    >
                        <RestoreIcon />
                        <p
                            style={{
                                margin: 0,
                                fontSize: "16px",
                                fontWeight: "500",
                            }}
                        >
                            History
                        </p>
                    </div>

                    <Button
                        onClick={() => {
                            localStorage.removeItem("token");
                            navigate("/auth");
                        }}
                        variant="contained"
                        sx={{
                            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                            borderRadius: "12px",
                            px: 3,
                            py: 1,
                            textTransform: "none",
                            fontSize: "15px",
                            fontWeight: "600",
                            boxShadow: "0 4px 14px rgba(124, 58, 237, 0.35)",
                            "&:hover": {
                                background: "linear-gradient(135deg, #6d28d9, #9333ea)",
                            },
                        }}
                    >
                        Logout
                    </Button>
                </div>
            </div>

            <div
                className="meetContainer"
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    minHeight: "calc(100vh - 80px)",
                    padding: "40px 80px",
                    background: "linear-gradient(135deg, #0d0e12 0%, #171822 100%)",
                }}
            >
                <div
                    className="leftPanel"
                    style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                    }}
                >
                    <div>
                        <h2
                            style={{
                                fontSize: "48px",
                                fontWeight: "800",
                                lineHeight: "1.25",
                                color: "#ffffff",
                                marginBottom: "20px",
                                maxWidth: "680px",
                            }}
                        >
                            High Quality Video Calls For{" "}
                            <span
                                style={{
                                    background: "linear-gradient(135deg, #a855f7, #ec4899)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                }}
                            >
                                Better Connections
                            </span>
                        </h2>

                        <p
                            style={{
                                fontSize: "18px",
                                color: "#a1a1aa",
                                marginBottom: "35px",
                                maxWidth: "560px",
                                lineHeight: "1.6",
                            }}
                        >
                            Connect instantly with family, friends, and colleagues in ultra-clear audio and video. Enter a room code or start a new call.
                        </p>

                        <div
                            style={{
                                display: "flex",
                                gap: "16px",
                                alignItems: "center",
                                marginTop: "20px",
                            }}
                        >
                            <TextField
                                onChange={(e) => setMeetingCode(e.target.value)}
                                value={meetingCode}
                                placeholder="Enter Meeting Code"
                                variant="outlined"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleJoinVideoCall();
                                }}
                                sx={{
                                    width: "350px",
                                    background: "rgba(255, 255, 255, 0.05)",
                                    borderRadius: "14px",
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: "14px",
                                        height: "58px",
                                        color: "white",
                                        "& fieldset": {
                                            borderColor: "rgba(255, 255, 255, 0.15)",
                                        },
                                        "&:hover fieldset": {
                                            borderColor: "#7c3aed",
                                        },
                                        "&.Mui-focused fieldset": {
                                            borderColor: "#a855f7",
                                        },
                                    },
                                    "& input::placeholder": {
                                        color: "rgba(255, 255, 255, 0.5)",
                                    },
                                }}
                            />

                            <Button
                                onClick={handleJoinVideoCall}
                                variant="contained"
                                sx={{
                                    height: "58px",
                                    minWidth: "140px",
                                    borderRadius: "14px",
                                    fontSize: "16px",
                                    fontWeight: "bold",
                                    textTransform: "none",
                                    background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                                    boxShadow: "0 6px 20px rgba(124, 58, 237, 0.4)",
                                    "&:hover": {
                                        background: "linear-gradient(135deg, #6d28d9, #9333ea)",
                                    },
                                }}
                            >
                                Join Call
                            </Button>
                        </div>
                    </div>
                </div>

                <div
                    className="rightPanel"
                    style={{
                        flex: 1,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <img
                        src="/logo3.png"
                        alt="video-call"
                        style={{
                            width: "90%",
                            maxWidth: "580px",
                            objectFit: "contain",
                            filter: "drop-shadow(0 20px 40px rgba(0, 0, 0, 0.4))",
                        }}
                    />
                </div>
            </div>
        </>
    );
}

export default withAuth(HomeComponent);
