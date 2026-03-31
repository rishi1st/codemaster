# 🚀 CodeMaster — Full Stack Coding Interview Platform

CodeMaster is a production-ready, full-stack web application designed to help developers prepare for coding interviews through an integrated experience that combines problem solving, AI assistance, algorithm visualization, and a multi-language compiler.

This project is built with a modern tech stack and follows industry-grade practices including authentication, secure session handling, scalable architecture, and deployment on cloud platforms.

---

# 🌐 Live Application

Frontend: https://codemaster-tan.vercel.app/


---

# 🧠 Overview

CodeMaster is not just another coding practice platform. It is designed to simulate real interview environments and provide intelligent assistance to improve problem-solving skills.

It integrates multiple tools into a single platform:

* Coding problems with filtering and tracking
* AI-powered hints and explanations
* Algorithm visualization for better understanding
* Multi-language code execution
* Secure authentication system (JWT + Google OAuth)

---

# ✨ Features

## 🔐 Authentication System

* Email & password login
* Google OAuth login
* JWT-based authentication
* Secure session handling using HTTP-only cookies
* Persistent login across refresh
* Logout with token invalidation (Redis)

---

## 🧩 Problem Solving System

* Browse coding problems
* Filter by difficulty and tags
* Track solved problems
* Dynamic problem loading

---

## 🤖 AI Coding Assistant

* Get hints for problems
* Understand optimal approaches
* Improve logic with AI feedback

---

## 📊 Algorithm Visualizer

* Step-by-step visualization
* Helps understand sorting, graphs, DP, etc.
* Improves conceptual clarity

---

## 💻 Online Compiler

* Run code in multiple languages
* Real-time execution
* No setup required

---

## 📈 Performance Tracking

* Track solved problems
* Progress insights (future scope expandable)

---

# 🏗️ Tech Stack

## Frontend

* React.js
* Redux Toolkit
* Tailwind CSS
* Axios

## Backend

* Node.js
* Express.js
* MongoDB (Mongoose)

## Authentication

* JWT (JSON Web Tokens)
* Google OAuth (google-auth-library)

## Caching / Security

* Redis (for token blocklisting)

## Deployment

* Frontend: Vercel
* Backend: Render

---

# 🔐 Authentication Flow

1. User logs in (email/password or Google)
2. Server generates JWT token
3. Token is stored in HTTP-only cookie
4. Browser automatically sends cookie with each request
5. Backend validates token for protected routes

Security practices:

* httpOnly cookies prevent XSS access
* sameSite: "none" for cross-origin requests
* secure: true ensures HTTPS-only transmission
* Redis used for token invalidation (logout)

---

# ⚙️ Environment Variables

## Frontend (.env)

```
VITE_API_BASE_URL=https://codemaster-xibr.onrender.com
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

---

## Backend (.env)

```
PORT=3000
MONGO_URI=your_mongodb_connection
JWT_KEY=your_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
FRONTEND_URL=https://codemaster-tan.vercel.app
REDIS_URL=your_redis_url
```

---

# 🧪 Running Locally

## Clone the repository

```
git clone https://github.com/your-username/codemaster.git
cd codemaster
```

---

## Backend Setup

```
cd server
npm install
npm run dev
```

---

## Frontend Setup

```
cd client
npm install
npm run dev
```
---

# 🧱 Project Structure

```
codemaster/
│
├── client/              # React frontend
│   ├── src/
│   ├── components/
│   ├── pages/
│   └── redux/
│
├── server/              # Express backend
│   ├── src/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   └── middleware/
│
└── README.md
```

---

# 🛠️ Future Improvements

* Leaderboard system
* Daily streak tracking
* Discussion forum
* AI mock interviews
* Performance analytics dashboard
* Code submission history

---

# 📌 Key Learnings

This project demonstrates:

* Full-stack development (MERN)
* Authentication system design
* Secure cookie handling
* CORS and cross-origin issues
* Deployment debugging (Vercel + Render)
* Real-world production bug fixing
* State management using Redux Toolkit

---

# 👨‍💻 Author

Rishikesh Gupta
Full Stack MERN Developer

---

# ⭐ Final Thoughts

CodeMaster is built to solve a real problem — helping developers prepare effectively for technical interviews.

This project reflects strong understanding of:

* System design fundamentals
* Authentication security
* Frontend-backend integration
* Production deployment challenges

---

# 💥 Status

✅ Fully functional
✅ Production deployed
✅ Authentication secure
✅ Scalable architecture

---

If you found this project useful, feel free to give it a ⭐ and share feedback!

---
