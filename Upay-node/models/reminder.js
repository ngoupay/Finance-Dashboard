const mongoose = require('mongoose');

const reminderSchema = mongoose.Schema({
    approvalId: { type: String, default: "" },
    url: { type: String, default: "" },
    attachment: { type: String, default: "" },
    mailIds: { type: Array, default: [] },
    date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('reminder', reminderSchema);
