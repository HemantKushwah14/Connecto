<img width="1917" height="992" alt="Screenshot 2026-08-14 213845" src="https://github.com/user-attachments/assets/e9ff9451-5b37-45f8-91f2-59304d4e95a5" />

This project is a Full-Stack Real-Time Video Calling Application built using React, Node.js, Socket.IO, WebRTC, and MongoDB. It enables users to conduct secure, peer-to-peer video meetings with real-time chat and screen-sharing capabilities.

The application follows a WebRTC peer-to-peer architecture, where media (audio/video) is transmitted directly between users, while Socket.IO acts as a signaling server to establish and manage connections. This design minimizes server load and reduces latency.

✨ Key Features-->
  🔐 User Authentication (Register & Login with bcrypt hashing)
  🔑 Token-based authorization with protected routes
  📹 Real-time multi-user video calling (WebRTC)
  💬 In-call real-time chat using Socket.IO
  🖥️ Screen sharing support
  🔗 URL-based dynamic meeting rooms
  📜 Persistent meeting history in MongoDB
  🚪 Automatic cleanup when users leave a call
  🎨 Responsive UI built with Material UI
  
🏗️ Architecture-->
  Frontend: React, Context API, React Router, Material UI
  Backend: Node.js, Express.js, Socket.IO
  Database: MongoDB + Mongoose
  Real-time Communication: WebRTC (P2P) + Socket.IO (Signaling)
  
⚙️ How It Works-->
  Users register/login and receive a secure token.
  A meeting is joined via a unique URL (meeting code).
  Socket.IO connects users to a room and exchanges WebRTC signals.
  Peers establish a direct media connection (no media passes through the server).
  Chat messages are synced in real time.
  Meeting details are saved in user history.
