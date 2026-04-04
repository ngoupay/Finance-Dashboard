const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator')

const zoneSchema = mongoose.Schema({
  name: { type: String, required: true, unique: true }
});

zoneSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Zone', zoneSchema);
