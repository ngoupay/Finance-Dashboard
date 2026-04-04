const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator')

const userSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  zone: { type: String, required: true },
  reviewadmin : {type:String, required: false, default:'false'}
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);
