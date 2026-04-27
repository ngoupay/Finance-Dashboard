const mongoose = require('mongoose');

const billsSchema = mongoose.Schema({
  date: { type: Date, default: Date.now },
  approvalId: { type: String, required: true },
  claimId: { type: String, required: false },
  vendorname: { type: String, required: true },
  billnumber: { type: String, required: true },
  billamount: { type: Number, required: true },
  description: { type: String, required: false },
  project: { type: String, required: false },
  budgetHead: { type: String, required: false },
  budgetSubHead: { type: String, required: false },
  fileName: { type: String, required: false },
  assetdetails: { type: String, required: false },
  assetvalue: { type: String, required: false },
  assetcodes: { type: String, required: false },
  assettype: { type: String, required: false },
  filePath: { type: String, required: false },
});

module.exports = mongoose.model('Bill', billsSchema);
