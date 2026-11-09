import axios from "axios";
import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import server from "../enviroment.js";

export const AuthContext = createContext({});

const client = axios.create();

client.interceptors.request.use((config) => {
    config.baseURL = `${server}/api/v1/users`;
    return config;
});

export const AuthProvider = ({ children }) => {
    const authContext = useContext(AuthContext);
    const [userData, setUserData] = useState(authContext);
    const router = useNavigate();

    const handleRegister = async (name, username, password) => {
        try {
            const cleanName = (name || "").trim();
            const cleanUsername = (username || "").trim();

            let request = await client.post("/register", {
                name: cleanName,
                username: cleanUsername,
                password: password,
            });

            return request.data?.message || "User Registered Successfully";
        } catch (err) {
            throw err;
        }
    };

    const handleLogin = async (username, password) => {
        try {
            const cleanUsername = (username || "").trim();

            let request = await client.post("/login", {
                username: cleanUsername,
                password: password,
            });

            if (request.data && request.data.token) {
                localStorage.setItem("token", request.data.token);
                router("/home");
                return request.data;
            } else {
                throw new Error("No token returned by server");
            }
        } catch (err) {
            throw err;
        }
    };

    const getHistoryOfUser = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return [];

            let request = await client.get("/get_all_activity", {
                params: { token },
            });
            return Array.isArray(request.data) ? request.data : [];
        } catch (err) {
            console.error("Failed to load user history:", err);
            return [];
        }
    };

    const addToUserHistory = async (meetingCode) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return null;

            let request = await client.post("/add_to_activity", {
                token: token,
                meeting_code: meetingCode,
            });
            return request.data;
        } catch (e) {
            console.error("Failed to record meeting to history:", e);
            return null;
        }
    };

    const data = {
        userData,
        setUserData,
        addToUserHistory,
        getHistoryOfUser,
        handleRegister,
        handleLogin,
    };

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    );
};
