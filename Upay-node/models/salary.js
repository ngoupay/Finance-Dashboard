const mongoose = require('mongoose');

const salarySchema = mongoose.Schema({
  date: { type: Date, default: Date.now },
  approvalId: { type: String, required: true },
  employeename: { type: String, required: true },
  salarynumber: { type: String, required: true },
  salaryamount: { type: Number, required: true },
  description: { type: String, required: false },
  filePath: { type: String, required: false },
  fileName: { type: String, required: false },
});

module.exports = mongoose.model('Salary', salarySchema);
