require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const roomRoutes = require('./src/routes/roomRoutes');

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

app.use('/room', roomRoutes);

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => res.send('Smart-QA backend live!'));

app.listen(PORT, (error) => {
    if (error) {
        console.log('Server not started due to:', error);
    } else {
        console.log(`Server running on port ${PORT}`);
    }
});