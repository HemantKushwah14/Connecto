import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import "../App.css";
import { Button, IconButton, TextField } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import { AuthContext } from '../contexts/AuthContext';

function HomeComponent() {
    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const { addToUserHistory } = useContext(AuthContext);

    let handleJoinVideoCall = async () => {
        await addToUserHistory(meetingCode)
        navigate(`/${meetingCode}`)
    }

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

                    background: "#0f172a",

                    color: "white",

                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                }}
            >

                <div
                    style={{
                        display: "flex",
                        alignItems: "center"
                    }}
                >

                    <h2
                        style={{
                            fontSize: "34px",
                            fontWeight: "700",
                            margin: 0,
                            letterSpacing: "0.5px",
                        }}
                    >
                        Want a Video Call
                    </h2>

                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                    }}
                >

                    <div
                        onClick={() => {
                            navigate("/history")
                        }}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            cursor: "pointer",
                            color: "#cbd5e1",
                        }}
                    >

                        <RestoreIcon />

                        <p
                            style={{
                                margin: 0,
                                fontSize: "17px",
                            }}
                        >
                            History
                        </p>

                    </div>

                    <Button
                        onClick={() => {
                            localStorage.removeItem("token")
                            navigate("/auth")
                        }}

                        variant="contained"

                        sx={{
                            background:
                                "linear-gradient(90deg,#7c3aed,#2563eb)",

                            borderRadius: "12px",

                            px: 3,

                            py: 1,

                            textTransform: "none",

                            fontSize: "15px",

                            fontWeight: "600",

                            "&:hover": {
                                background:
                                    "linear-gradient(90deg,#6d28d9,#1d4ed8)",
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

                    background:
                        "linear-gradient(to right,#f8fafc,#e2e8f0)",
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
                                fontSize: "52px",
                                fontWeight: "800",
                                lineHeight: "1.2",
                                color: "#0f172a",
                                marginBottom: "30px",
                                maxWidth: "700px",
                            }}
                        >
                            Providing Quality Video Call For Improving Quality Bonds
                        </h2>

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

                                label="Meeting Code"

                                variant="outlined"

                                sx={{
                                    width: "350px",

                                    background: "white",

                                    borderRadius: "14px",

                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: "14px",
                                        height: "58px",
                                    },
                                }}
                            />

                            <Button
                                onClick={handleJoinVideoCall}

                                variant='contained'

                                sx={{
                                    height: "58px",

                                    minWidth: "140px",

                                    borderRadius: "14px",

                                    fontSize: "16px",

                                    fontWeight: "bold",

                                    background:
                                        "linear-gradient(90deg,#7c3aed,#2563eb)",

                                    "&:hover": {
                                        background:
                                            "linear-gradient(90deg,#6d28d9,#1d4ed8)",
                                    },
                                }}
                            >
                                Join
                            </Button>

                        </div>

                    </div>

                </div>

                <div
                    className='rightPanel'

                    style={{
                        flex: 1,

                        display: "flex",

                        justifyContent: "center",

                        alignItems: "center",
                    }}
                >

                    <img
                        src='/logo3.png'
                        alt="video-call"

                        style={{
                            width: "90%",
                            maxWidth: "650px",
                            objectFit: "contain",
                        }}
                    />

                </div>

            </div>

        </>
    )
}

export default withAuth(HomeComponent)