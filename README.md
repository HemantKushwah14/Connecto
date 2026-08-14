<img width="1917" height="992" alt="Screenshot 2026-08-14 213845" src="https://github.com/user-attachments/assets/3793ff60-b90c-4037-bd15-e2cfc3b09be3" />
<img width="1911" height="987" alt="Screenshot 2026-08-14 213859" src="https://github.com/user-attachments/assets/da1a79ed-0aa7-4c76-b599-33f48b8d4da9" />
<img width="1917" height="985" alt="Screenshot 2026-08-14 213916" src="https://github.com/user-attachments/assets/fbf0e731-b7bd-430b-874b-f14c35592451" />
<img width="1917" height="987" alt="Screenshot 2026-08-14 214424" src="https://github.com/user-attachments/assets/fb8b76d4-0303-4def-8234-6a62d64cd85b" />
<img width="1917" height="997" alt="Screenshot 2026-08-14 214554" src="https://github.com/user-attachments/assets/ec44b3e3-e12e-4ffb-b2fb-586e25586003" />


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
