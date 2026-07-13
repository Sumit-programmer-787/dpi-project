const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require('./db');
const startSubscriber = require('./services/redisSubscriber');

const app = express();
const PORT = process.env.PORT || 5000

connectDB();
startSubscriber();

app.use(cors());
app.use(express.json());

app.get('/', (req,res) => {
    res.json({ message: 'DPI server is running'});
});

app.get('/health', (req,res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
