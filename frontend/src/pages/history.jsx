import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom';

import {
    Card,
    CardContent,
    Typography,
    IconButton,
    Box,
    Avatar,
    Chip
} from '@mui/material';

import HomeIcon from '@mui/icons-material/Home';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

export default function History() {

    const { getHistoryOfUser } = useContext(AuthContext);

    const [meetings, setMeetings] = useState([]);

    const routeTo = useNavigate();

    useEffect(() => {

        const fetchHistory = async () => {

            try {

                const history = await getHistoryOfUser();

                setMeetings(history);

            } catch {
                // snackbar later
            }

        }

        fetchHistory();

    }, [])

    let formatDate = (dateString) => {

        const date = new Date(dateString);

        const day = date.getDate().toString().padStart(2, "0");

        const month = (date.getMonth() + 1)
            .toString()
            .padStart(2, "0")

        const year = date.getFullYear();

        return `${day}/${month}/${year}`
    }

    return (

        <div
            style={{
                minHeight: "100vh",

                background:
                    "linear-gradient(to bottom right,#0f172a,#1e293b)",

                padding: "30px",
            }}
        >

            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",

                    mb: 5,
                }}
            >

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                    }}
                >

                    <IconButton
                        onClick={() => {
                            routeTo("/home")
                        }}

                        sx={{
                            background:
                                "rgba(255,255,255,0.08)",

                            color: "white",

                            "&:hover": {
                                background:
                                    "rgba(255,255,255,0.15)",
                            },
                        }}
                    >

                        <HomeIcon />

                    </IconButton>

                    <Typography
                        variant="h4"

                        sx={{
                            color: "white",
                            fontWeight: "700",
                        }}
                    >
                        Meeting History
                    </Typography>

                </Box>

                <Chip
                    label={`${meetings.length} Meetings`}

                    sx={{
                        background:
                            "linear-gradient(90deg,#7c3aed,#2563eb)",

                        color: "white",

                        fontWeight: "600",

                        fontSize: "15px",
                    }}
                />

            </Box>

            <Box
                sx={{
                    display: "grid",

                    gridTemplateColumns:
                        "repeat(auto-fit,minmax(320px,1fr))",

                    gap: 3,
                }}
            >

                {
                    meetings.length !== 0 ?

                        meetings.map((e, i) => {

                            return (

                                <Card
                                    key={i}

                                    sx={{
                                        borderRadius: "24px",

                                        background:
                                            "rgba(255,255,255,0.06)",

                                        border:
                                            "1px solid rgba(255,255,255,0.08)",

                                        backdropFilter:
                                            "blur(10px)",

                                        color: "white",

                                        transition: "0.3s",

                                        "&:hover": {
                                            transform:
                                                "translateY(-5px)",

                                            boxShadow:
                                                "0 10px 25px rgba(0,0,0,0.3)",
                                        },
                                    }}
                                >

                                    <CardContent>

                                        {/* TOP ICON */}

                                        <Avatar
                                            sx={{
                                                bgcolor: "#7c3aed",

                                                width: 55,
                                                height: 55,

                                                mb: 3,
                                            }}
                                        >

                                            <VideoCallIcon />

                                        </Avatar>


                                        {/* CODE */}

                                        <Typography
                                            sx={{
                                                color: "#94a3b8",
                                                fontSize: "14px",
                                                mb: 1,
                                            }}
                                        >
                                            Meeting Code
                                        </Typography>

                                        <Typography
                                            variant="h5"

                                            sx={{
                                                fontWeight: "700",
                                                mb: 3,

                                                wordBreak:
                                                    "break-word",
                                            }}
                                        >
                                            {e.meetingCode}
                                        </Typography>


                                        {/* DATE */}

                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1,
                                            }}
                                        >

                                            <AccessTimeIcon
                                                sx={{
                                                    color:
                                                        "#60a5fa",
                                                }}
                                            />

                                            <Typography
                                                sx={{
                                                    color:
                                                        "#cbd5e1",
                                                }}
                                            >
                                                {formatDate(e.date)}
                                            </Typography>

                                        </Box>

                                    </CardContent>

                                </Card>

                            )

                        })

                        :

                        <Box
                            sx={{
                                width: "100%",

                                display: "flex",
                                justifyContent: "center",

                                mt: 10,
                            }}
                        >

                            <Typography
                                variant="h5"

                                sx={{
                                    color: "#cbd5e1",
                                }}
                            >
                                No Meeting History Found
                            </Typography>

                        </Box>
                }

            </Box>

        </div>
    )
}