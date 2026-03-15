const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // In production, restrict this
        methods: ["GET", "POST"]
    }
});

let appointments = [];

// API Routes
app.get('/api/appointments', (req, res) => {
    res.json(appointments);
});

app.post('/api/appointments', (req, res) => {
    const newAppointment = {
        id: Date.now(),
        ...req.body,
        status: 'pending',
        createdAt: new Date()
    };
    appointments.push(newAppointment);
    
    // Notify admin via socket
    io.emit('new_appointment', newAppointment);
    
    res.status(201).json(newAppointment);
});

app.patch('/api/appointments/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    appointments = appointments.map(app => 
        app.id == id ? { ...app, status } : app
    );
    
    io.emit('appointment_updated', { id, status });
    res.json({ success: true });
});

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
