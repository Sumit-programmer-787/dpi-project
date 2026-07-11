const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now,
    },
    type: {
        type: String,
        required: true,
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
    },
    message: {
        type: String,
        required: true,
    },
    src_ip: {
        type: String,
    },
    dst_ip: {
        type: String,
    },
    
});

module.exports = mongoose.model('Alert', alertSchema);