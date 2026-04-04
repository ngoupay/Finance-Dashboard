const mongoose = require('mongoose');

const awardSchema = mongoose.Schema({
  date: { type: Date, default: Date.now },
  approvalId: { type: String, required: true },
  vendorname: { type: String, required: true },
  vendor_addr: { type: String, required: true },
  billnumber: { type: String, required: true },
  billamount: { type: Number, required: true },
  deliveryschedule: { type: String, required: false },
  payterms: { type: String, required: false },
  unitprice: { type: String, required: false },
  netbillamount: { type: Number, required: true },
  vendor_preference: { type: String, required: false },
  shipping_handling_chrg: { type: String, required: false },
  gst_tax: { type: String, required: false },
  description_warranty: { type: String, required: false },
  filePath: { type: String, required: false },
  fileName: { type: String, required: false }
});

module.exports = mongoose.model('AwardApproval', awardSchema);
