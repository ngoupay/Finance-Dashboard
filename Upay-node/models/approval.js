const mongoose = require('mongoose');

const approvalSchema = mongoose.Schema({
  approvalId: { type: String, required: true },
  name: { type: String, required: true },
  zone: { type: String, required: true },
  email: { type: String, required: true },
  designation: { type: String, required: true },
  contact: { type: String, required: true },
  amount: { type: Number, required: true },
  subject: { type: String, required: true },
  body: { type: String, required: false },
  status: { type: String, default: 'new' },
  to_central_zone: { type: Boolean, default: false },
  isAudit: { type: Boolean, default: false },//@akshay
  mediator_remarks: { type: String },
  approver_remarks: { type: String },
  date: { type: Date, default: Date.now },
  updatedDate: { type: Date, default: Date.now },
  createddate: { type: Date, default: Date.now },
  fundTransferDate: { type: Date },//@akshay
  timeline: { type: String, required: false },
  filePath: { type: String, required: false },
  fileName: { type: String, required: false },
  initiator_notified: { type: Boolean, default: false },
  return_editable: { type: Boolean, default: false },//@akshay
  amount_transferred: { type: Number, required: false, default: 0 },
  transactionId: { type: String, required: false, default: "" },
  approval_type: { type: String, required: false },
  payment_details: { type: String, required: false },
  account_no: { type: String, required: false },
  bank_name: { type: String, required: false },
  payee_name: { type: String, required: false },
  ifsc_code: { type: String, required: false },
  advance_details: { type: String, required: false },
  awardquantity: { type: Number, required: false, default: 0 },
  awardvalue: { type: Number, required: false, default: 0 },
  claimamount: { type: Number, required: false, default: 0 },
  unutilizedamount: { type: Number, required: false, default: 0 },
  utilizedamount: { type: Number, required: false, default: 0 },
  shipping_addr: { type: String, required: false },
  awardItemDesc: { type: String, required: false },
  actionsBy: { type: Array, default: [] },
  notes: {
    budget_head: { type: String, required: false },
    budget_subhead: { type: String, required: false },
    expenditure_code: { type: String, required: false },
    billed_amount: { type: Number, required: false, default: 0 },
    advance_amount: { type: Number, required: false, default: 0 },
    centre: { type: String, required: false },
    invoice_id: { type: String, required: false }
  },
  claims: [{
    approvalId: { type: String, required: false },
    claimId: { type: String, required: false },
    name: { type: String, required: false },
    zone: { type: String, required: false },
    email: { type: String, required: false },
    designation: { type: String, required: false },
    contact: { type: String, required: false },
    amount: { type: Number, required: false },
    subject: { type: String, required: false },
    body: { type: String, required: false },
    status: { type: String, default: 'new' },
    to_central_zone: { type: Boolean, default: false },
    isAudit: { type: Boolean, default: false },//@akshay
    mediator_remarks: { type: String, required: false },
    approver_remarks: { type: String, required: false },
    date: { type: Date, default: Date.now },
    fundTransferDate: { type: Date },//@akshay
    timeline: { type: String, required: false },
    initiator_notified: { type: Boolean, default: false },
    return_editable: { type: Boolean, default: false },//@akshay
    amount_transferred: { type: Number, required: false, default: 0 },
    transactionId: { type: String, required: false, default: "" },
    approval_type: { type: String, required: false },
    account_no: { type: String, required: false },
    bank_name: { type: String, required: false },
    payee_name: { type: String, required: false },
    ifsc_code: { type: String, required: false },
    bill_vendornumbers: { type: Array, required: false }
  }
  ]
});

approvalSchema.pre('save', function (next) {
  this.updatedDate = new Date();
  next();
});

module.exports = mongoose.model('Approval', approvalSchema);
