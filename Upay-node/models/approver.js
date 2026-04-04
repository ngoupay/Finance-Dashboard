const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator')

const approverSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true },
  zone: { type: String, required: true }
});

approverSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Approver', approverSchema);
