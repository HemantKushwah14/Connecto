const getBackendUrl = () => {
    // 1. If running in browser on localhost or 127.0.0.1, connect to local backend on port 8000
    if (
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
         window.location.hostname === "127.0.0.1")
    ) {
        return "http://localhost:8000";
    }

    // 2. If valid REACT_APP_BACKEND_URL is provided in production environment
    if (
        process.env.REACT_APP_BACKEND_URL &&
        !process.env.REACT_APP_BACKEND_URL.includes("connecto-backend-9gkx.onrender.com")
    ) {
        return process.env.REACT_APP_BACKEND_URL;
    }

    // 3. Fallback
    return process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
};

const server = getBackendUrl();

export default server;
