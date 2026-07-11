const mongoose = require('mongoose');

const packetSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now,
    },
    protocol: {
        type: String,
        required: true,
    },
    src_ip: {
        type: String,
        required: true,
    },
    dst_ip: {
        type: String,
        required: true,
    },
    src_port: {
        type: Number,
        default: null,
    },
    dst_port: {
        type: Number,
        default: null,
    },
    size: {
        type: Number,
        required: true,

    },
    ttl: {
        type: Number,
    },
    flags: {
        type: String,
        default: null,
    },
    });

    packetSchema.index({ timestamp: 1}, {expireAfterSeconds: 86400 });
    module.exports = mongoose.model('Packet', packetSchema);