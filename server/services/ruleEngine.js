const Alert = require('../models/Alert');

const PORT_THRESHOLD = 10;
const TIME_WINDOW_MS = 10000;
const activityTracker = new Map();

const PACKET_RATE_THRESHOLD = 50;
const PACKET_RATE_WINDOW_MS = 5000;
const packetRateTracker = new Map();

async function checkForPortScan(packetData, io) {
  if (!packetData.flags || !packetData.flags.includes('S')) {
    return;
  }

  const { src_ip, dst_port } = packetData;
  const now = Date.now();

  let activity = activityTracker.get(src_ip);

  if (!activity || now - activity.firstSeen > TIME_WINDOW_MS) {
    activity = { ports: new Set(), firstSeen: now };
    activityTracker.set(src_ip, activity);
  }

  activity.ports.add(dst_port);

  if (activity.ports.size >= PORT_THRESHOLD) {
    const alert = await Alert.create({
      type: 'port_scan',
      severity: 'high',
      message: `Possible port scan detected: ${src_ip} attempted connections to ${activity.ports.size} different ports within ${TIME_WINDOW_MS / 1000} seconds`,
      src_ip: src_ip,
    });

    if (io) {
      io.emit('new_alert', alert);
    }

    console.log(`ALERT: Port scan detected from ${src_ip}`);

    activityTracker.delete(src_ip);
  }
}

async function checkForTrafficSpike(packetData, io) {
  const { src_ip } = packetData;
  const now = Date.now();

  let rate = packetRateTracker.get(src_ip);

  if (!rate || now - rate.windowStart > PACKET_RATE_WINDOW_MS) {
    rate = { count: 0, windowStart: now };
    packetRateTracker.set(src_ip, rate);
  }

  rate.count += 1;

  if (rate.count >= PACKET_RATE_THRESHOLD) {
    const alert = await Alert.create({
      type: 'traffic_spike',
      severity: 'medium',
      message: `Traffic spike detected: ${src_ip} sent ${rate.count} packets within ${PACKET_RATE_WINDOW_MS / 1000} seconds`,
      src_ip: src_ip,
    });

    if (io) {
      io.emit('new_alert', alert);
    }

    console.log(`ALERT: Traffic spike detected from ${src_ip}`);

    packetRateTracker.delete(src_ip);
  }
}

module.exports = { checkForPortScan, checkForTrafficSpike };