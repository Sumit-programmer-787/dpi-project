const Alert = require('../models/Alert');
const alert = require('../models/Alert');

const PORT_THRESHOLD = 10;
const TIME_WINDOW_MS = 10000;

const activityTracker = new Map();

async function checkForPortScan(packetData) {
    if (!packetData.flags || !packetData.flags.includes('S')) {
        return;
    }

    const { src_ip, dst_port } = packetData;
    const now = Date.now();

    let activity = activityTracker.get(src_ip);

    if(!activity || now - activity.firstSeen > TIME_WINDOW_MS) {
        activity = { ports: new Set(), firstSeen: now };
        activityTracker.set(src_ip, activity);
    }

    activity.ports.add(dst_port);

    if (activity.ports.size >= PORT_THRESHOLD) {
        await Alert.create({
            type: 'port_scan' ,
            severity: 'high' ,
            message: `Possible port scan detected: ${src_ip} attempted connections to 
            ${activity.ports.size} different ports within ${TIME_WINDOW_MS / 1000} seconds` ,
            src_ip: src_ip,
        });

        console.log(`ALERT: Port scan detected from ${src_ip}`);

        activityTracker.delete(src_ip);
    }
}

module.exports = { checkForPortScan};