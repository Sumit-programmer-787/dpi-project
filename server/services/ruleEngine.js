const Alert = require('../models/Alert');

const PORT_THRESHOLD = 10;
const TIME_WINDOW_MS = 10000;
const activityTracker = new Map();

const PACKET_RATE_THRESHOLD = 150;
const PACKET_RATE_WINDOW_MS = 5000;
const packetRateTracker = new Map();

const ALERT_COOLDOWN_MS = 30000;
const alertCooldownTracker = new Map();

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
    // Reset tracking IMMEDIATELY, synchronously, before the await below.
    // Packets from Redis can arrive in a fast burst, and Node fires the
    // 'message' event for each one without waiting for the previous
    // async call to finish. If we waited until AFTER Alert.create()
    // resolved to delete this entry, several concurrent calls could all
    // see the same "still over threshold" state and each create their
    // own duplicate alert before any of them finished. Clearing it here
    // closes that gap immediately.
    activityTracker.delete(src_ip);

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
    const lastAlertTime = alertCooldownTracker.get(src_ip);

    if (!lastAlertTime || now - lastAlertTime > ALERT_COOLDOWN_MS) {
      // Set the cooldown timestamp and reset the rate tracker BEFORE
      // awaiting Alert.create(). This is the actual fix for the race
      // condition: Alert.create() is a real database write that takes
      // real time to complete. If many packets arrive in a fast burst,
      // several concurrent calls to this function can all check
      // alertCooldownTracker before any of them finish writing to it --
      // so they'd all see "no cooldown yet" and all create their own
      // alert. Writing to the Map synchronously, right here, before the
      // await, closes that timing gap: any other concurrent call
      // checking immediately after this line will correctly see the
      // cooldown already active.
      alertCooldownTracker.set(src_ip, now);
      packetRateTracker.delete(src_ip);

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
    } else {
      packetRateTracker.delete(src_ip);
    }
  }
}

module.exports = { checkForPortScan, checkForTrafficSpike };