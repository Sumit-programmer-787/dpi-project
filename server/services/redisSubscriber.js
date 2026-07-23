const Redis = require('ioredis');
const Packet = require('../models/Packet');
const {
  checkForPortScan,
  checkForTrafficSpike,
  checkForBlacklistedIp,
  checkForDnsAbuse,
} = require('./ruleEngine');

const CHANNEL_NAME = 'packets';

function startRedisSubscriber(io) {
  const subscriber = new Redis({ host: 'localhost', port: 6379 });

  subscriber.subscribe(CHANNEL_NAME, (err) => {
    if (err) {
      console.error('Failed to subscribe to Redis channel:', err.message);
      return;
    }
    console.log(`Subscribed to Redis channel '${CHANNEL_NAME}'`);
  });

  subscriber.on('message', async (channel, message) => {
    try {
      const packetData = JSON.parse(message);
      const savedPacket = await Packet.create(packetData);
      io.emit('new_packet', savedPacket);

      await checkForPortScan(packetData, io);
      await checkForTrafficSpike(packetData, io);
      await checkForBlacklistedIp(packetData, io);
      await checkForDnsAbuse(packetData, io);

      console.log(`Saved packet: ${packetData.protocol} ${packetData.src_ip} -> ${packetData.dst_ip}`);
    } catch (error) {
      console.error('Error saving packet:', error.message);
    }
  });

  subscriber.on('error', (err) => {
    console.error('Redis subscriber error:', err.message);
  });

  return subscriber;
}

module.exports = startRedisSubscriber;