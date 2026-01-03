---
description: How to run the complete project (Backend and Frontend)
---

To run the project, follow these steps:

### 1. Prerequisites
- Ensure you have **Node.js** installed.
- Ensure **MongoDB** is running locally (or update `MONGODB_URI` in `backend/.env`).

### 2. Backend Setup
1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the backend server:
   ```bash
   npm run dev
   ```
   The backend will start on `http://localhost:5000`.

### 3. Frontend Setup
1. Open a **new** terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The frontend will start on `http://localhost:3000` (or the port shown in the terminal).

### 4. Access the App
Open your browser and go to the URL provided by the frontend (usually `http://localhost:3000`).
