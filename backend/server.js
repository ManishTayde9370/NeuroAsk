require('dotenv').config();
require('dotenv').config({ path: './.env' });


const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const http = require('http');  //Part of core node api/module which enables creating server
const { Server } = require('socket.io');

const roomRoutes = require('./src/routes/roomRoutes');
const authRoutes = require('./src/routes/authRoutes');

const app = express();
app.use(express.json());

const corsOptions = {
    origin: process.env.CLIENT_URL,
    credentials: true
};

app.use(cors(corsOptions));

mongoose.connect(process.env.MONGODB_URL)
    .then(() => console.log('MongoDB Connected'))
    .catch((error) => console.log('Failed to connect to MongoDB: ', error));


const server = http.createServer(app);

const io = new Server(server, {
    cors:{
        origin: "*",
        methods: ["GET", "POST", "DELETE", "PUT"]
    }
});


//Gets executed on every new connection.
//If the nre connection is for custom event "join-room"
//to join a room, we add it to the pool of clients sharing same roomCode.
io.on("connection",(socket)=>{
    console.log("New client connection: ", socket.id);

    socket.on("join-room",(roomCode)=>{
        socket.join(roomCode);
        console.log(`User joined room: ${roomCode}`);
    });

    socket.on("join", (roomCode) => {
        socket.join(roomCode);
        console.log(`User joined room: ${roomCode}`);
    });

    socket.on("disconnect",()=>{
        console.log("Client disconnected: ", socket.id);
    })
});

app.set("io",io);

app.use('/room', roomRoutes);
app.use('/auth', authRoutes);

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => res.send('Smart-QA backend live!'));
console.log("Loaded MONGODB_URL:", process.env.MONGODB_URL);


server.listen(PORT, (error) => {
    if (error) {
        console.log('Server not started due to:', error);
    } else {
        console.log(`Server running on port ${PORT}`);
    }
});