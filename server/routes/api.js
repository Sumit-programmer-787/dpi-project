const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const Packet = require('../models/Packet');

router.get('/alerts', async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ timestamp: -1 }).limit(50);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/packets', async (req, res) => {
  try {
    const packets = await Packet.find().sort({ timestamp: -1 }).limit(100);
    res.json(packets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;