# 🛡️ Safe Stream - Multi-Modal Video Management Platform

Safe Stream is a production-ready, multi-tenant video streaming and management application. It features advanced AI-powered content analysis, real-time processing updates, and a robust role-based access control (RBAC) system.

## 🚀 Features

- **Multi-Modal AI Content Analysis**:
  - **Visual Analysis**: Uses `meta-llama/llama-4-scout-17b-16e-instruct` to analyze video frames.
  - **Audio Analysis**: Extracts audio and transcribes it using `whisper-large-v3-turbo`.
  - **Contextual Analysis**: Combines transcript, visuals, and metadata using `llama-3.3-70b-versatile` for final safety classification.
- **Video Thumbnails**: Automatically extracts a frame from each video to serve as a thumbnail in the dashboard.
- **Role-Based Access Control (RBAC)**:
  - **Admin**: Global system access, user management, and video controls. Seeded default account: `admin@gmail.com` / `admin`.
  - **Editor**: Upload, edit, and delete videos within their organization.
  - **Viewer**: Read-only access to organization videos.
- **Real-Time Progress**: Live processing updates (transcription, vision analysis, etc.) via Socket.io.
- **High-Performance Streaming**: Efficient video playback using HTTP Range requests.
- **Advanced Filtering**: Search by title and sort by date or file size.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, MongoDB (Mongoose), Socket.io, FFmpeg, Groq SDK.
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Axios.
- **Authentication**: JWT (JSON Web Tokens) with secure password hashing (bcrypt).

---

## ⚙️ Installation and Setup Guide

### Prerequisites
- **Node.js**: v18+ recommended.
- **MongoDB**: Local instance or MongoDB Atlas.
- **FFmpeg**: Must be installed and accessible in the system PATH.
- **Groq API Key**: Required for AI content analysis.

### 1. Clone and Install
```bash
git clone <repository-url>
cd Assignment
npm install
```

### 2. Backend Configuration
Navigate to the `backend` directory and create a `.env` file:
```bash
cd backend
npm install
```
`.env` template:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/video-stream-app
JWT_SECRET=your_super_secret_key
GROQ_API_KEY=your_groq_api_key
NODE_ENV=development
```

### 3. Frontend Configuration
Navigate to the `frontend` directory and install dependencies:
```bash
cd ../frontend
npm install
```

### 4. Running the Application
Use the provided workflow or run manually:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

---

## 📖 API Documentation

### Authentication
- `POST /api/auth/register`: Register a new user (Editor or Viewer). Admin registration is blocked.
- `POST /api/auth/login`: Login and receive a JWT.

### Videos
- `GET /api/videos`: List all videos. Admins see all; Editors/Viewers see only their tenant's videos.
- `POST /api/videos/upload`: Upload a new video (Editor/Admin). Triggers the multi-modal AI pipeline.
- `GET /api/videos/stream/:id`: Stream video content with Range support.
- `DELETE /api/videos/:id`: Delete a video (Editor/Admin).

### Admin (Admin Only)
- `GET /api/admin/users`: List all system users.
- `DELETE /api/admin/users/:id`: Delete a user.

---

## 👤 User Manual

### Getting Started
1. **Login**: Use the default admin credentials (`admin@gmail.com` / `admin`) for initial setup.
2. **Organization Setup**: When a new user registers, they provide an "Organization Name" which creates their tenant.
3. **Roles**:
   - **Editors** can upload videos and manage their organization's library.
   - **Viewers** can only watch videos.

### Video Management
- **Uploading**: Enter a title and select a video file. The upload progress is shown first, followed by AI processing progress.
- **Processing**: The AI analyzes the video's visuals and audio. You will see real-time updates as it transcribes and classifies the content.
- **Safety Status**: Videos are marked as "Safe" or "Flagged". Flagged videos are still accessible but clearly marked for review.

---

## 🏗️ Architecture Overview

The application follows a modular, service-oriented architecture:

### Multi-Modal AI Pipeline
1. **Extraction**: FFmpeg extracts a representative frame (thumbnail) and the audio track (MP3).
2. **Transcription**: Groq's Whisper model converts audio to text.
3. **Visual Analysis**: Llama 4 Scout analyzes the extracted frame for sensitive visual content.
4. **Contextual Aggregation**: Llama 3.3 70B analyzes the transcript, visual results, and filename to make a final safety determination.
5. **Real-Time Updates**: Socket.io broadcasts progress events to the frontend at each stage.

### Multi-Tenancy
Data is isolated at the database level using `tenantId`. Middleware ensures that users can only access resources belonging to their organization, while Global Admins have cross-tenant visibility.

---

## 🌐 Deployment Guide

To make Safe Stream publicly accessible, you can use the automated configuration files provided.

### Option 1: Automated Deployment (Recommended)

1. **Database**: Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and get your connection string.
2. **One-Click Render Deployment**:
   - Connect your GitHub repository to [Render](https://render.com/).
   - Render will automatically detect the `render.yaml` file and set up both the backend (via Docker) and the frontend.
   - You only need to provide the environment variables (`MONGODB_URI`, `JWT_SECRET`, `GROQ_API_KEY`) when prompted.

### Option 2: Manual Deployment

#### 1. Database (MongoDB Atlas)
- Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
- Get your connection string and replace `localhost` with the Atlas URI in your production environment variables.

#### 2. Backend Deployment (Render / Railway)
- **Platform**: [Render](https://render.com/) is recommended.
- **Environment Variables**: Set `PORT`, `MONGODB_URI`, `JWT_SECRET`, and `GROQ_API_KEY`.
- **Build/Start**: The provided `backend/Dockerfile` handles FFmpeg installation and setup automatically.

#### 3. Frontend Deployment (Vercel / Netlify)
- **Platform**: [Vercel](https://vercel.com/) or [Netlify](https://www.netlify.com/).
- **Environment Variables**: Set `VITE_API_URL` to your deployed backend URL.
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Routing**: The `frontend/vercel.json` handles SPA routing for Vercel.

#### 4. CORS Configuration
- Update the backend's CORS settings in `src/index.js` to allow requests from your production frontend URL.

---

## 📝 Assumptions and Design Decisions

1. **Seeded Admin**: For security and ease of use, a default admin is created on startup. This prevents unauthorized users from registering as admins.
2. **Multi-Modal Robustness**: We assume that visual-only analysis is insufficient. By transcribing audio and analyzing it alongside visuals, we provide a much higher level of content safety.
3. **Local Storage**: Videos and thumbnails are stored in the `uploads/` directory. This is a design choice for the assignment to avoid external cloud dependencies.
4. **Vision Model Selection**: We use `meta-llama/llama-4-scout-17b-16e-instruct` for vision as it provides a good balance of speed and reasoning for safety classification.
5. **Asynchronous Processing**: Video processing is handled asynchronously after upload to ensure a responsive user experience.
