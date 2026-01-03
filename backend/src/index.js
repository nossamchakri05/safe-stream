const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Database Connection
const seedAdmin = async () => {
    try {
        const User = require('./models/User');
        const bcrypt = require('bcryptjs');
        const adminEmail = 'admin@gmail.com';
        const existingAdmin = await User.findOne({ email: adminEmail });
        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash('admin', 8);
            const admin = new User({
                username: 'admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'Admin'
            });
            await admin.save();
            console.log('Default admin user created');
        }
    } catch (e) {
        console.error('Error seeding admin:', e.message);
    }
};

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        await seedAdmin();
    })
    .catch(err => console.error('Could not connect to MongoDB', err));

// Socket.io connection
io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('joinTenant', (tenantId) => {
        socket.join(tenantId);
        console.log(`Client joined tenant room: ${tenantId}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/videos', require('./routes/videoRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.get('/', (req, res) => {
    res.send('Video Streaming API is running...');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };
