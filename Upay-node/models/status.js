const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator')

const statusSchema = mongoose.Schema({
  statusName: { type: String, required: true,unique: true },
});
statusSchema.plugin(uniqueValidator);
module.exports = mongoose.model('Status', statusSchema);
