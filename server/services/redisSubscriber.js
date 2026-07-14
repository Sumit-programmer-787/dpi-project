const Redis = require('ioredis');
const Packet = require('../models/Packet');
const  { checkForPortScan } = require('./ruleEngine');

const CHANNEL_NAME = 'packets';


function startRedisSubscriber() {
    const subscriber = new Redis({
        host: 'localhost',
        port: 6379,
    });

    subscriber.subscribe(CHANNEL_NAME, (err, count) => {
        if (err) {
            console.error('Failed to subscribe to Redis channel:', err.message);
            return;
        }
        console.log(`Subscribed to Redis channel '${CHANNEL_NAME}'`);
    });

    subscriber.on('message', async (channel, message) => {
        try {
            const packetData = JSON.parse(message);
            await Packet.create(packetData);
            await checkForPortScan(packetData);

            console.log(`Saved packet: ${packetData.protocol}
                ${packetData.src_ip} -> ${packetData.dst_ip}`);
            }catch (error) {
                console.error('Error saving packet' , error.message);
            }
        });
        subscriber.on('error', (err) => {
            console.error('Redis subscriber error:', err.message);
        });
        return subscriber;
        }

        module.exports = startRedisSubscriber;

