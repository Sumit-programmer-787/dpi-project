const Alert = require('../models/Alert');
const { isBlacklisted } = require('../data/blacklist');

const PORT_THRESHOLD = 10;
const TIME_WINDOW_MS = 10000;
const activityTracker = new Map();

const PACKET_RATE_THRESHOLD = 150;
const PACKET_RATE_WINDOW_MS = 5000;
const packetRateTracker = new Map();

const ALERT_COOLDOWN_MS = 30000;
const alertCooldownTracker = new Map();

const DNS_PORT = 53;
const DNS_LOOKUP_THRESHOLD = 20;
const DNS_TIME_WINDOW_MS = 15000;
const dnsActivityTracker = new Map();

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
    activityTracker.delete(src_ip);
    const alert = await Alert.create({
      type: 'port_scan',
      severity: 'high',
      message: `Possible port scan detected: ${src_ip} attempted connections to ${activity.ports.size} different ports within ${TIME_WINDOW_MS / 1000} seconds`,
      src_ip: src_ip,
    });
    if (io) io.emit('new_alert', alert);
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
      alertCooldownTracker.set(src_ip, now);
      packetRateTracker.delete(src_ip);
      const alert = await Alert.create({
        type: 'traffic_spike',
        severity: 'medium',
        message: `Traffic spike detected: ${src_ip} sent ${rate.count} packets within ${PACKET_RATE_WINDOW_MS / 1000} seconds`,
        src_ip: src_ip,
      });
      if (io) io.emit('new_alert', alert);
      console.log(`ALERT: Traffic spike detected from ${src_ip}`);
    } else {
      packetRateTracker.delete(src_ip);
    }
  }
}

async function checkForBlacklistedIp(packetData, io) {
  const { src_ip, dst_ip } = packetData;
  const flaggedIp = isBlacklisted(src_ip) ? src_ip
    : isBlacklisted(dst_ip) ? dst_ip
    : null;
  if (!flaggedIp) return;

  const now = Date.now();
  const lastAlertTime = alertCooldownTracker.get(`blacklist:${flaggedIp}`);
  if (lastAlertTime && now - lastAlertTime < ALERT_COOLDOWN_MS) return;
  alertCooldownTracker.set(`blacklist:${flaggedIp}`, now);

  const alert = await Alert.create({
    type: 'blacklisted_ip',
    severity: 'high',
    message: `Traffic involving known-blacklisted address ${flaggedIp} detected (src: ${src_ip}, dst: ${dst_ip})`,
    src_ip: src_ip,
    dst_ip: dst_ip,
  });
  if (io) io.emit('new_alert', alert);
  console.log(`ALERT: Blacklisted IP traffic involving ${flaggedIp}`);
}

async function checkForDnsAbuse(packetData, io) {
  if (packetData.dst_port !== DNS_PORT && packetData.src_port !== DNS_PORT) {
    return;
  }
  const { src_ip, dst_ip } = packetData;
  const now = Date.now();
  let activity = dnsActivityTracker.get(src_ip);
  if (!activity || now - activity.firstSeen > DNS_TIME_WINDOW_MS) {
    activity = { destinations: new Set(), firstSeen: now };
    dnsActivityTracker.set(src_ip, activity);
  }
  activity.destinations.add(dst_ip);

  if (activity.destinations.size >= DNS_LOOKUP_THRESHOLD) {
    dnsActivityTracker.delete(src_ip);
    const alert = await Alert.create({
      type: 'dns_abuse',
      severity: 'medium',
      message: `Unusual DNS activity: ${src_ip} contacted ${activity.destinations.size} distinct DNS destinations within ${DNS_TIME_WINDOW_MS / 1000} seconds`,
      src_ip: src_ip,
    });
    if (io) io.emit('new_alert', alert);
    console.log(`ALERT: DNS abuse pattern detected from ${src_ip}`);
  }
}

module.exports = {
  checkForPortScan,
  checkForTrafficSpike,
  checkForBlacklistedIp,
  checkForDnsAbuse,
};