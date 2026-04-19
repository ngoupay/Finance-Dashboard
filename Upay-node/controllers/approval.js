const Approval = require('../models/approval');
const Reminder = require('../models/reminder');
const User = require('../models/user');
const Approver = require('../models/approver');
const Counter = require('../models/counter');
const Salary = require('../models/salary');
const AwardTable = require('../models/awardapproval');
const Bill = require('../models/bills');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const request = require('request');
const sgMail = require('@sendgrid/mail');
const fs = require("fs");
sgMail.setApiKey(process.env.SENDGRID_API);

const serverURL = process.env.SERVER_URL;
const api_key = process.env.OTP_API_KEY;

const status = {
  "zero": "new",
  "one": "pending",
  "two": "approved",
  "three": "fund transferred utilization pending",
  "four": "settled without fund transfer",
  "five": "settled with fund transfer",
  "six": "partiall utilization done",
  "seven": "partially settled with extra claim",
  "eight": "fully settled",
  "nine": "fully settled with extra claim",
  "ten": "to Central",
  "eleven": "rejected",
  "twelve": "transferred",
  "thirteen": "partially approved"
};

function notifyAuthorizedZone(req) {
  User.find({ zone: req.body.zone }).then(users => {
    users.forEach(user => {
      try {
        const msg = {
          to: user.email,
          from: "ngoupay@gmail.com",
          subject: 'New Approval Request',
          html: `A new approval has came for ${user.zone} zone. Please check the dashboard.`
        };
        sgMail.send(msg);
      } catch (e) {
        console.log("Error sending mail: ", e);
      }
    });
  }).catch(error => {
    console.log(error);
  });

  Approver.find({ zone: req.body.zone }).then(approvers => {
    approvers.forEach(approver => {
      try {
        const msg = {
          to: req.body.zone !== 'Central' ? approver.email : 'president.upay@gmail.com',
          from: "ngoupay@gmail.com",
          subject: 'New Approval Request',
          html: `A new approval has came for ${approver.zone} zone. Please check the dashboard.`
        };
        sgMail.send(msg);
      } catch (e) {
        console.log("Error sending mail: ", e);
      }
    });
  }).catch(error => {
    console.log(error);
  });
}


async function notifyAuthorizedZoneAboutEdit(req) {
  try {
    const users = await User.find({ zone: req.body.zone });
    if (users && users.length > 0) {
      users.forEach(async (user) => {
        const msg = {
          to: user.email,
          from: "ngoupay@gmail.com",
          subject: 'Approval Resubmitted',
          html: `Approval (${req.body.approvalId}) has been resubmitted for ${user.zone} zone. Please check the dashboard.`
        };
        try {
          await sgMail.send(msg);
        } catch (e) {
          console.error("Error sending mail to user: ", e);
        }
      });
    }

    const approvers = await Approver.find({ zone: req.body.zone });
    if (approvers && approvers.length > 0) {
      approvers.forEach(async (approver) => {
        const toEmail = req.body.zone !== 'Central' ? approver.email : 'president.upay@gmail.com';
        const msg = {
          to: toEmail,
          from: "ngoupay@gmail.com",
          subject: 'Approval Resubmitted',
          html: `Approval (${req.body.approvalId}) has been resubmitted for ${approver.zone} zone. Please check the dashboard.`
        };
        try {
          await sgMail.send(msg);
        } catch (e) {
          console.error("Error sending mail to approver: ", e);
        }
      });
    }

  } catch (error) {
    console.error('Error occurred in notifyAuthorizedZoneAboutEdit:', error);
  }
}

async function getNextSequenceValue(sequenceName) {
  let seq;
  const sequenceDocument = Counter.findOneAndUpdate(
    { id: sequenceName }, { $inc: { seq: 1 } }, { new: true, upsert: true }
  ).then(result => {
    // console.log("result: ", result);
    seq = result.seq;
  }
  ).catch(err => {
    // console.log("err: ", err);
  });
  await sequenceDocument;
  return seq;
}

exports.createBill = async (req, res, next) => {
  // console.log('bills',req.body)
  let istTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  istTime = new Date(istTime);
  pathToAttachment = null;
  file = null;
  orginal_filename = null;
  if (req.file) {
    file = req.file;
    orginal_filename = req.file.originalname;
    pathToAttachment = req.file.location;
  }
  // console.log("req.body: ", req.body);
  const bills = new Bill({
    approvalId: req.body.approvalId,
    claimId: req.body.claimId,
    vendorname: req.body.vendorname,
    billnumber: req.body.billnumber,
    billamount: req.body.billamount,
    description: req.body.description,
    assetdetails: req.body.assetdetails,
    assetvalue: req.body.assetvalue,
    assetcodes: req.body.assetcodes,
    filePath: pathToAttachment,
    fileName: orginal_filename
  });
  bills.save().then(uploadedBill => {
    res.status(200).json({ message: 'Thanks for your response.' });
  }).catch(error => {
    // console.log(error);
    res.status(500).json({
      message: 'Bill not uploaded'
    });
  });

};

exports.updateBill = async (req, res, next) => {
  try {
    if (!req.params.id) {
      return res.status(404).send('Bill not found');
    }
    let billToUpdate = await Bill.findById(req.params.id);
    if (!billToUpdate) {
      return res.status(404).send('Bill not found');
    }


    let updatedBill = {
      approvalId: req.body.approvalId,
      claimId: req.body.claimId,
      vendorname: req.body.vendorname,
      billnumber: req.body.billnumber,
      billamount: req.body.billamount,
      description: req.body.description,
      assetdetails: req.body.assetdetails,
      assetvalue: req.body.assetvalue,
      assetcodes: req.body.assetcodes,
    };
    if (req.file) {
      updatedBill.filePath = req.file.location;
      updatedBill.fileName = req.file.originalname;
    }

    Object.assign(billToUpdate, updatedBill);

    await billToUpdate.save();
    res.status(200).json({ message: 'Bill updated.' });
  } catch (error) {
    console.error("error updating bill:", error);
    res.status(500).json({
      message: 'Bill not updated.'
    });
  }
};

exports.updateAward = async (req, res, next) => {
  try {
    if (!req.params.id) {
      return res.status(404).send('Award not found');
    }
    let awardToUpdate = await AwardTable.findById(req.params.id);
    if (!awardToUpdate) {
      return res.status(404).send('Award not found');
    }


    let updatedAward = {
      approvalId: req.body.approvalId,
      vendorname: req.body.vendorname,
      vendor_addr: req.body.vendorAdd,
      billnumber: req.body.billnumber,
      billamount: req.body.billamount,
      deliveryschedule: req.body.deliveryschedule,
      payterms: req.body.payterms,
      unitprice: req.body.unitprice,
      netbillamount: req.body.netbillamount,
      vendor_preference: req.body.vendor_preference,
      shipping_handling_chrg: req.body.otherAndshipping,
      gst_tax: req.body.tax,
      description_warranty: req.body.remarksAndWarranty,
    };
    if (req.file) {
      updatedAward.filePath = req.file.location;
      updatedAward.fileName = req.file.originalname;
    }

    Object.assign(awardToUpdate, updatedAward);

    await awardToUpdate.save();
    res.status(200).json({ message: 'Award updated.' });
  } catch (error) {
    console.error("error updating award:", error);
    res.status(500).json({
      message: 'Award not updated.'
    });
  }
};

exports.updateSalary = async (req, res, next) => {
  try {
    if (!req.params.id) {
      return res.status(404).send('Salary not found');
    }
    let salaryToUpdate = await Salary.findById(req.params.id);
    if (!salaryToUpdate) {
      return res.status(404).send('Salary not found');
    }

    let updatedSalary = {
      approvalId: req.body.approvalId,
      employeename: req.body.employeename,
      salarynumber: req.body.salarynumber,
      salaryamount: req.body.salaryamount,
      description: req.body.description,
    };

    if (req.file) {
      updatedSalary.filePath = req.file.location;
      updatedSalary.fileName = req.file.originalname;
    }

    Object.assign(salaryToUpdate, updatedSalary);

    await salaryToUpdate.save();
    res.status(200).json({ message: 'Salary updated.' });
  } catch (error) {
    console.error("error updating salary:", error);
    res.status(500).json({
      message: 'Salary not updated.'
    });
  }
};

exports.createSalary = async (req, res, next) => {
  // console.log('Salary',req.body)
  let istTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  istTime = new Date(istTime);
  pathToAttachment = null;
  file = null;
  orginal_filename = null;
  if (req.file) {
    file = req.file;
    orginal_filename = req.file.originalname;
    pathToAttachment = req.file.location;
  }
  // console.log("req.body: ", req.body);
  const salary = new Salary({
    approvalId: req.body.approvalId,
    employeename: req.body.employeename,
    salarynumber: req.body.salarynumber,
    salaryamount: req.body.salaryamount,
    description: req.body.description,
    filePath: pathToAttachment,
    fileName: orginal_filename
  });
  salary.save().then(uploadedsalary => {
    res.status(200).json({ message: 'Thanks for your response.' });
  }).catch(error => {
    // console.log(error);
    res.status(500).json({
      message: 'Salary not uploaded'
    });
  });

};
exports.createAward = async (req, res, next) => {
  // console.log('Award',req.body)

  pathToAttachment = null;
  file = null;
  orginal_filename = null;
  if (req.file) {
    file = req.file;
    orginal_filename = req.file.originalname;
    pathToAttachment = req.file.location;
  }
  // console.log("req.body: ", req.body);
  const award = new AwardTable({
    approvalId: req.body.approvalId,
    vendorname: req.body.vendorname,
    vendor_addr: req.body.vendorAdd,
    billnumber: req.body.billnumber,
    billamount: req.body.billamount,
    deliveryschedule: req.body.deliveryschedule,
    payterms: req.body.payterms,
    unitprice: req.body.unitprice,
    netbillamount: req.body.netbillamount,
    vendor_preference: req.body.vendor_preference,
    shipping_handling_chrg: req.body.otherAndshipping,
    gst_tax: req.body.tax,
    description_warranty: req.body.remarksAndWarranty,
    filePath: pathToAttachment,
    fileName: orginal_filename
  });
  award.save().then(uploadedaward => {
    res.status(200).json({ message: 'Thanks for your response.' });
  }).catch(error => {
    // console.log(error);
    res.status(500).json({
      message: 'Award not uploaded'
    });
  });

};
exports.createApproval2 = async (req, res, next) => {
  let istTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  istTime = new Date(istTime);
  // console.log("From Create2",req.body,req.params)
  if (req.body.type == 'Award Approval') {
    const approval = new Approval({
      approvalId: "UPAY" + req.body.zone.slice(0, 2).toUpperCase() + "0" + await getNextSequenceValue("approvalId"),
      name: req.body.name,
      zone: req.body.zone,
      email: req.body.email,
      designation: req.body.designation,
      contact: req.body.contact,
      amount: req.body.amount,
      awardvalue: req.body.awardValue,
      subject: req.body.subject,
      body: req.body.body,
      approval_type: req.body.type,
      account_no: req.body.accountNumber,
      bank_name: req.body.bankName,
      payee_name: req.body.payeeName,
      ifsc_code: req.body.bankIfsc,
      shipping_addr: req.body.shippingAddress,
      awardItemDesc: req.body.awardItemDesc,
      awardquantity: req.body.awardquantity,
      timeline: req.body.email + ' created the approval at ' + istTime + '.'
    });
    approval.save().then(createdApproval => {
      try {
        const msg1 = {
          to: req.body.email,
          from: "ngoupay@gmail.com",
          subject: 'Approval Submitted',
          html: `Your approval(Approval Id: ${createdApproval.approvalId}) has been submitted successfully. You can track your approval at <a href='${process.env.CLIENT_URL}/track'>this link</a>`
        };
        sgMail.send(msg1);
      } catch (e) {
        // console.log("error sending mail: ",e);
      }
      res.status(201).json({
        message: 'Approval send succesfully',
        approvalId: createdApproval.approvalId
      });
    })
      .catch(error => {
        // console.log(error);
        res.status(500).json({
          message: 'Approval could not be send'
        });
      });
  }
  if (req.body.type == 'Salary') {
    const approval = new Approval({
      approvalId: "UPAY" + req.body.zone.slice(0, 2).toUpperCase() + "0" + await getNextSequenceValue("approvalId"),
      name: req.body.name,
      zone: req.body.zone,
      email: req.body.email,
      designation: req.body.designation,
      contact: req.body.contact,
      amount: req.body.amount,
      subject: req.body.subject,
      body: req.body.body,
      approval_type: req.body.type,
      account_no: req.body.accountNumber,
      bank_name: req.body.bankName,
      payee_name: req.body.payeeName,
      ifsc_code: req.body.bankIfsc,
      timeline: req.body.email + ' created the approval at ' + istTime + '.'
    });
    approval.save().then(createdApproval => {
      try {
        const msg1 = {
          to: req.body.email,
          from: "ngoupay@gmail.com",
          subject: 'Approval Submitted',
          html: `Your approval(Approval Id: ${createdApproval.approvalId}) has been submitted successfully. You can track your approval at <a href='${process.env.CLIENT_URL}/track'>this link</a>`
        };
        sgMail.send(msg1);
      } catch (e) {
        // console.log("error sending mail: ",e);
      }
      res.status(201).json({
        message: 'Approval send succesfully',
        approvalId: createdApproval.approvalId
      });
    })
      .catch(error => {
        // console.log(error);
        res.status(500).json({
          message: 'Approval could not be send'
        });
      });
  }

  if (req.body.type == 'Advance or Imprest' || req.body.type == 'Claim') {
    const approval = new Approval({
      approvalId: "UPAY" + req.body.zone.slice(0, 2).toUpperCase() + "0" + await getNextSequenceValue("approvalId"),
      name: req.body.name,
      zone: req.body.zone,
      email: req.body.email,
      designation: req.body.designation,
      contact: req.body.contact,
      amount: req.body.amount,
      subject: req.body.subject,
      body: req.body.body,
      approval_type: req.body.type,
      account_no: req.body.accountNumber,
      bank_name: req.body.bankName,
      payee_name: req.body.payeeName,
      ifsc_code: req.body.bankIfsc,
      timeline: req.body.email + ' created the approval at ' + istTime + '.'

    });
    approval.save().then(createdApproval => {
      try {
        const msg1 = {
          to: req.body.email,
          from: "ngoupay@gmail.com",
          subject: 'Approval Submitted',
          html: `Your approval(Approval Id: ${createdApproval.approvalId}) has been submitted successfully. You can track your approval at <a href='${process.env.CLIENT_URL}/track'>this link</a>`
        };
        sgMail.send(msg1);
      } catch (e) {
        // console.log("error sending mail: ",e);
      }
      res.status(201).json({
        message: 'Approval send succesfully',
        approvalId: createdApproval.approvalId
      });
    })
      .catch(error => {
        // console.log(error);
        res.status(500).json({
          message: 'Approval could not be send'
        });
      });
  }

  if (req.body.type == 'Claim against advance/PO') {
    Approval.findOne({ approvalId: req.params.id }).then(approval => {
      //newclaimid =  "UPAY"+ req.body.zone+"0"+  getNextSequenceValue("approvalId");
      //// console.log(newclaimid)
      let newclaimid = null;
      (async () => {
        newclaimid = "UPAY" + req.body.zone.slice(0, 2).toUpperCase() + "0" + await getNextSequenceValue("approvalId");
        return newclaimid;
      })().then(newclaimid => {
        // console.log('2 ',newclaimid)
        let claim = {
          $push: {
            claims: {
              approvalId: req.body.advanceid,
              claimId: newclaimid,
              name: req.body.name,
              zone: req.body.zone,
              email: req.body.email,
              designation: req.body.designation,
              contact: req.body.contact,
              amount: req.body.amount,
              subject: req.body.subject,
              body: "Claim against " + req.body.advanceid + " Approvel ID. ",
              approval_type: req.body.type,
              account_no: req.body.accountNumber,
              bank_name: req.body.bankName,
              payee_name: req.body.payeeName,
              ifsc_code: req.body.bankIfsc,
              timeline: req.body.email + ' created the approval at ' + istTime + '.'
            }
          }
        };
        if (approval) {
          // console.log('3 ',claim)
          Approval.updateOne({ approvalId: req.params.id }, claim).then(
            result => {
              if (result.n > 0) {
                Approval.updateOne({ approvalId: req.params.id }, { $set: { "date": new Date() } }).then(
                  result => {
                    if (result.n > 0) {
                      try {
                        const msg1 = {
                          to: req.body.email,
                          from: "ngoupay@gmail.com",
                          subject: 'Approval Submitted',
                          html: `Your approval(Approval Id: ${req.params.id} and Claim Id: ${newclaimid} )has been submitted successfully. You can track your approval at <a href='${process.env.CLIENT_URL}/track'>this link</a>`
                        };
                        sgMail.send(msg1);
                      } catch (e) {
                        // console.log("error sending mail: ",e);
                      }
                      //res.status(200).json({message: 'Thanks for your response.',claimid: newclaimid});
                      res.status(201).json({
                        message: 'Approval send succesfully',
                        approvalId: newclaimid,
                        claimid: newclaimid
                      });
                    }
                    else {
                      res.status(401).json({ error_message: 'Not Authorized!' });
                    }
                  }

                );


              }
              else {
                res.status(401).json({ error_message: 'Not Authorized!' });
              }
            }
          )
            .catch(err => {
              res.status(500).json({
                error_message: 'Approval could not be send'
              });
            });

        }
      });

    });
  }

  notifyAuthorizedZone(req);
};

exports.createApproval = async (req, res, next) => {
  let istTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  istTime = new Date(istTime);
  pathToAttachment = null;
  file = null;
  orginal_filename = null;
  if (req.file) {
    file = req.file;
    orginal_filename = req.file.originalname;
    pathToAttachment = req.file.location;
  }
  //// console.log("req.body: ", req.body);
  const approval = new Approval({
    approvalId: "UPAY" + req.body.zone.slice(0, 2).toUpperCase() + "0" + await getNextSequenceValue("approvalId"),
    name: req.body.name,
    zone: req.body.zone,
    email: req.body.email,
    designation: req.body.designation,
    contact: req.body.contact,
    amount: req.body.amount,
    subject: req.body.subject,
    body: req.body.body,
    approval_type: req.body.type,
    fileName: orginal_filename,
    filePath: pathToAttachment,
    account_no: req.body.accountNumber,
    bank_name: req.body.bankName,
    payee_name: req.body.payeeName,
    ifsc_code: req.body.bankIfsc,
    timeline: req.body.email + ' created the approval at ' + istTime + '.'
  });
  approval.save().then(createdApproval => {
    try {
      const msg1 = {
        to: req.body.email,
        from: "ngoupay@gmail.com",
        subject: 'Approval Submitted',
        html: `Your approval(Approval Id: ${createdApproval.approvalId}) has been submitted successfully. You can track your approval at <a href='${process.env.CLIENT_URL}/track'>this link</a>`
      };
      sgMail.send(msg1);
    } catch (e) {
      //// console.log("error sending mail: ",e);
    }
    res.status(201).json({
      message: 'Approval send succesfully',
      approvalId: createdApproval.approvalId
    });
  })
    .catch(error => {
      // // console.log(error);
      res.status(500).json({
        message: 'Approval could not be send'
      });
    });
  User.find({ zone: req.body.zone }).then(users => {
    users.forEach(user => {
      try {
        const msg = {
          to: user.email,
          from: "ngoupay@gmail.com",
          subject: 'New Approval Request',
          html: `A new approval has come for ${user.zone} zone. Please check the dashboard.`
        };
        sgMail.send(msg);
      } catch (e) {
        // console.log("error sending mail: ",e);
      }
    });
  }).catch(error => {
    // console.log(error);
  });

  Approver.find({ zone: req.body.zone }).then(approvers => {
    approvers.forEach(approver => {
      try {
        const msg = {
          to: req.body.zone !== 'Central' ? approver.email : 'president.upay@gmail.com',
          from: "ngoupay@gmail.com",
          subject: 'New Approval Request',
          html: `A new approval has come for ${approver.zone} zone. Please check the dashboard.`
        };
        sgMail.send(msg);
      } catch (e) {
        // console.log("error sending mail: ",e);
      }
    });
  }).catch(error => {
    // console.log(error);
  });
};

exports.updateApproval2 = async (req, res, next) => {
  try {
    let token = req.body.token;
    try {
      jwt.verify(token, process.env.EMAIL_KEY);
    } catch (e) {
      return res.status(401).json({ error_message: 'Token Expired. The update approval link is valid for 3 days only.' });
    }

    if (!req.body.approvalId) {
      return res.status(404).send('Approval not found');
    }
    let approvalToUpdate = await Approval.findOne({ approvalId: req.body.approvalId });
    if (!approvalToUpdate) {
      approvalToUpdate = await Approval.findOne({ claims: { $elemMatch: { claimId: req.body.approvalId } } });
    }
    if (!approvalToUpdate) {
      return res.status(404).send('Approval not found');
    }

    let istTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    istTime = new Date(istTime);

    if (req.body.type == 'Advance or Imprest' || req.body.type == 'Claim') {
      const updatedData = {
        approvalId: req.body.approvalId,
        name: req.body.name,
        zone: req.body.zone,
        email: req.body.email,
        status: "resubmitted",
        designation: req.body.designation,
        contact: req.body.contact,
        amount: req.body.amount,
        subject: req.body.subject,
        body: req.body.body,
        approval_type: req.body.type,
        account_no: req.body.accountNumber,
        bank_name: req.body.bankName,
        payee_name: req.body.payeeName,
        ifsc_code: req.body.bankIfsc,
        timeline: approvalToUpdate.timeline + '\n' + req.body.email + ' resubmitted the approval at ' + istTime + '.'
      };

      Object.assign(approvalToUpdate, updatedData);

      await approvalToUpdate.save();
      res.status(200).json({
        message: 'Approval updated succesfully',
        approvalId: approvalToUpdate.approvalId
      });
    }

    if (req.body.type == 'Claim against advance/PO') {
      const updatedData = {
        approvalId: req.body.approvalId,
        claimId: req.body.claimId,
        name: req.body.name,
        zone: req.body.zone,
        email: req.body.email,
        status: "resubmitted",
        designation: req.body.designation,
        contact: req.body.contact,
        amount: req.body.amount,
        subject: req.body.subject,
        body: "Claim against " + req.body.advanceid + " Approvel ID. ",
        approval_type: req.body.type,
        account_no: req.body.accountNumber,
        bank_name: req.body.bankName,
        payee_name: req.body.payeeName,
        ifsc_code: req.body.bankIfsc,
        timeline: approvalToUpdate.timeline + '\n' + req.body.email + ' resubmitted the approval at ' + istTime + '.'
      };

      for (let claim of approvalToUpdate.claims) {
        if (claim.claimId === updatedData.claimId) {
          claim = Object.assign(claim, updatedData);
          break;
        }
      }
      await approvalToUpdate.save();
      res.status(200).json({
        message: 'Approval updated succesfully',
        approvalId: updatedData.claimId,
        claimId: updatedData.claimId
      });
    }

    if (req.body.type == 'Award Approval') {
      const updatedData = {
        approvalId: req.body.approvalId,
        name: req.body.name,
        zone: req.body.zone,
        email: req.body.email,
        status: "resubmitted",
        designation: req.body.designation,
        contact: req.body.contact,
        amount: req.body.amount,
        awardvalue: req.body.awardValue,
        subject: req.body.subject,
        body: req.body.body,
        approval_type: req.body.type,
        account_no: req.body.accountNumber,
        bank_name: req.body.bankName,
        payee_name: req.body.payeeName,
        ifsc_code: req.body.bankIfsc,
        shipping_addr: req.body.shippingAddress,
        awardItemDesc: req.body.awardItemDesc,
        awardquantity: req.body.awardquantity,
        timeline: approvalToUpdate.timeline + '\n' + req.body.email + ' resubmitted the approval at ' + istTime + '.'
      };

      Object.assign(approvalToUpdate, updatedData);

      await approvalToUpdate.save();
      res.status(200).json({
        message: 'Approval updated succesfully',
        approvalId: approvalToUpdate.approvalId
      });

    }

    if (req.body.type == 'Salary') {
      const updatedData = {
        approvalId: req.body.approvalId,
        name: req.body.name,
        zone: req.body.zone,
        email: req.body.email,
        status: "resubmitted",
        designation: req.body.designation,
        contact: req.body.contact,
        amount: req.body.amount,
        subject: req.body.subject,
        body: req.body.body,
        approval_type: req.body.type,
        account_no: req.body.accountNumber,
        bank_name: req.body.bankName,
        payee_name: req.body.payeeName,
        ifsc_code: req.body.bankIfsc,
        timeline: approvalToUpdate.timeline + '\n' + req.body.email + ' resubmitted the approval at ' + istTime + '.'
      };

      Object.assign(approvalToUpdate, updatedData);

      await approvalToUpdate.save();
      res.status(200).json({
        message: 'Approval updated succesfully',
        approvalId: approvalToUpdate.approvalId
      });

    }


    notifyAuthorizedZoneAboutEdit(req);
  } catch (error) {
    console.error('Error occurred while updating approval2:', error);
    res.status(500).send('Internal Server Error');
  }
};

exports.updateApproval = async (req, res, next) => {
  try {
    let token = req.body.token;
    try {
      jwt.verify(token, process.env.EMAIL_KEY);
    } catch (e) {
      return res.status(401).json({ error_message: 'Token Expired. The update approval link is valid for 3 days only.' });
    }

    if (!req.body.approvalId) {
      return res.status(404).send('Approval not found');
    }
    let approvalToUpdate = await Approval.findOne({ approvalId: req.body.approvalId });
    if (!approvalToUpdate) {
      return res.status(404).send('Approval not found');
    }

    let istTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    istTime = new Date(istTime);

    let updatedData = {
      approvalId: req.body.approvalId,
      name: req.body.name,
      zone: req.body.zone,
      email: req.body.email,
      status: "resubmitted",
      designation: req.body.designation,
      contact: req.body.contact,
      amount: req.body.amount,
      subject: req.body.subject,
      body: req.body.body,
      approval_type: req.body.type,
      account_no: req.body.accountNumber,
      bank_name: req.body.bankName,
      payee_name: req.body.payeeName,
      ifsc_code: req.body.bankIfsc,
      timeline: approvalToUpdate.timeline + '\n' + req.body.email + ' resubmitted the approval at ' + istTime + '.'
    };

    if (req.file) {
      updatedData.fileName = req.file.originalname;
      updatedData.filePath = req.file.location;
    }

    Object.assign(approvalToUpdate, updatedData);

    await approvalToUpdate.save();
    res.status(200).json({
      message: 'Approval updated succesfully',
      approvalId: approvalToUpdate.approvalId
    });

    let users = await User.find({ zone: req.body.zone });
    if (users.length > 0) {
      for (let user of users) {
        const msg = {
          to: user.email,
          from: "ngoupay@gmail.com",
          subject: 'Approval Resubmitted',
          html: `Approval (${approvalToUpdate.approvalId}) has been resubmitted for ${user.zone} zone. Please check the dashboard.`
        };
        await sgMail.send(msg);
      }
    }

    let approvers = await Approver.find({ zone: req.body.zone });
    if (approvers.length > 0) {
      for (let approver of approvers) {
        const toEmail = req.body.zone !== 'Central' ? approver.email : 'president.upay@gmail.com';
        const msg2 = {
          to: toEmail,
          from: "ngoupay@gmail.com",
          subject: 'Approval Resubmitted',
          html: `Approval (${approvalToUpdate.approvalId}) has been resubmitted for ${approver.zone} zone. Please check the dashboard.`
        };
        await sgMail.send(msg2);
      }
    }

  } catch (error) {
    console.error('Error occurred while updating approval:', error);
    res.status(500).send('Internal Server Error');
  }
};

exports.getApproval = (req, res, next) => {

  let str1 = (req.query.search !== "undefined" ? req.query.search : '') +
    (req.query.zones !== "undefined" ? req.query.zones : '') +
    (req.query.status !== "undefined" ? req.query.status : '') +
    (req.query.approvaltype !== "undefined" ? req.query.approvaltype : '');
  let str = req.query.search.split(',').join("|");

  let zonestr = req.query.zones.split(',');
  let statusstr = req.query.status.split(',');
  let approvaltype = req.query.approvaltype.split(',');
  let start = req.query.start;
  let end = req.query.end;
  console.log("start date" + start, "end date" + end);
  const sort = req.query.sort;
  const order = req.query.order;
  const pageNum = req.query.pageNum;
  const pageSize = req.query.pageSize * 1;
  let approvalQuery;
  let totalCount = 0;
  if (str1 && str1 !== "undefined" && str1 != "null" && str1 != '') {
    //// console.log('load sorted values');
    if (
      (req.query.status !== 'undefined' && req.query.status != '' && req.query.zones !== 'undefined' && req.query.zones != '') ||
      (req.query.zones !== 'undefined' && req.query.zones != '' && req.query.approvaltype !== 'undefined' && req.query.approvaltype != '') ||
      (req.query.status !== 'undefined' && req.query.status != '' && req.query.approvaltype !== 'undefined' && req.query.approvaltype != '')
    ) {
      //str = new RegExp(str,'i');
      approvalQuery = Approval.find(req.userData.zone != 'admin' ? (req.userData.zone != 'Central' ? { zone: req.userData.zone } : {
        $or: [{
          to_central_zone
            : true
        }, { zone: "Central" }]
      }) : {});
      if ((req.query.status !== 'undefined' && req.query.status != '' && req.query.zones !== 'undefined' && req.query.zones != '' && req.query.approvaltype !== 'undefined' && req.query.approvaltype != ''))
        approvalQuery = approvalQuery.find(
          {
            //$or: [
            // { createddate: { $gte: new Date(start), $lt: new Date(end) } },
            //{ createddate: { $gte: ISODate(new Date(start)), $lt: ISODate(new Date(end)) } },
            //{
            $or: [
              {
                $and: [

                  { zone: { "$in": req.query.zones === 'undefined' && req.query.zones === '' ? str : zonestr } },
                  { status: { "$in": req.query.status === 'undefined' && req.query.status === '' ? str : statusstr } },
                  { approval_type: { "$in": req.query.approvaltype === 'undefined' && req.query.approvaltype === '' ? str : approvaltype } },
                ]
              },

              {
                approvalId: {
                  "$regex": str,
                  "$options": "i"
                }
              },
              {
                name: {
                  "$regex": str,
                  "$options": "i"
                }
              },
              {
                email: {
                  "$regex": str,
                  "$options": "i"
                }
              },
              {
                designation: {
                  "$regex": str,
                  "$options": "i"
                }
              },
              {
                contact: {
                  "$regex": str,
                  "$options": "i"
                }
              },
              {
                subject: {
                  "$regex": str,
                  "$options": "i"
                }
              },
              {
                body: {
                  "$regex": str,
                  "$options": "i"
                }
              },]
            //}
            //]

          }
        );
      else if ((req.query.status !== 'undefined' && req.query.status != '' && req.query.zones !== 'undefined' && req.query.zones != ''))
        approvalQuery = approvalQuery.find(
          {
            //$or: [
            // { createddate: { $gte: new Date(start), $lt: new Date(end) } },
            // { createddate: { $gte: ISODate(new Date(start)), $lt: ISODate(new Date(end)) } },

            // {
            $or: [
              {
                $and: [

                  { zone: { "$in": req.query.zones === 'undefined' && req.query.zones === '' ? str : zonestr } },
                  { status: { "$in": req.query.status === 'undefined' && req.query.status === '' ? str : statusstr } },
                ]
              },
              { approval_type: { "$in": req.query.approvaltype === 'undefined' && req.query.approvaltype === '' ? str : approvaltype } },
              {
                approvalId: {
                  "$regex": str,
                  "$options": "i"
                }
              },
              {
                name: {
                  "$regex": str,
                  "$options": "i"
                }
              },
              {
                email: {
                  "$regex": str,
                  "$options": "i"
                }
              },
              {
                designation: {
                  "$regex": str,
                  "$options": "i"
                }
              },
              {
                contact: {
                  "$regex": str,
                  "$options": "i"
                }
              },
              {
                subject: {
                  "$regex": str,
                  "$options": "i"
                }
              },
              {
                body: {
                  "$regex": str,
                  "$options": "i"
                }
              },]
            //}
            // ]

          }
        );
      else if ((req.query.zones !== 'undefined' && req.query.zones != '' && req.query.approvaltype !== 'undefined' && req.query.approvaltype != ''))
        approvalQuery = approvalQuery.find(
          {
            //$or: [
            // { createddate: { $gte: new Date(start), $lt: new Date(end) } },
            // { createddate: { $gte: ISODate(new Date(start)), $lt: ISODate(new Date(end)) } },

            // {
            $or: [
              {
                $and: [

                  { zone: { "$in": req.query.zones === 'undefined' && req.query.zones === '' ? str : zonestr } },
                  { approval_type: { "$in": req.query.approvaltype === 'undefined' && req.query.approvaltype === '' ? str : approvaltype } },
                ]
              },
              { status: { "$in": req.query.status === 'undefined' && req.query.status === '' ? str : statusstr } },
              {
                approvalId: {
                  "$regex": str,
                  "$options": "i"
                }
              },
              {
                name: {
                  "$regex": str,
                  "$options": "i"
                }
              },
              {
                email: {
                  "$regex": str,
                  "$options": "i"
                }
              },
              {
                designation: {
                  "$regex": str,
                  "$options": "i"
                }
              },
              {
                contact: {
                  "$regex": str,
                  "$options": "i"
                }
              },
              {
                subject: {
                  "$regex": str,
                  "$options": "i"
                }
              },
              {
                body: {
                  "$regex": str,
                  "$options": "i"
                }
              },]
            // }
            //]

          }
        );
      else if ((req.query.status !== 'undefined' && req.query.status != '' && req.query.approvaltype !== 'undefined' && req.query.approvaltype != ''))
        approvalQuery = approvalQuery.find(
          {
            // $or: [
            // { createddate: { $gte: new Date(start), $lt: new Date(end) } },
            // { createddate: { $gte: ISODate(new Date(start)), $lt: ISODate(new Date(end)) } },

            // {
            $or: [
              {
                $and: [
                  { status: { "$in": req.query.status === 'undefined' && req.query.status === '' ? str : statusstr } },
                  { approval_type: { "$in": req.query.approvaltype === 'undefined' && req.query.approvaltype === '' ? str : approvaltype } },
                ]
              },
              { zone: { "$in": req.query.zones === 'undefined' && req.query.zones === '' ? str : zonestr } },
              {
                approvalId: {
                  "$regex": str,
                  "$options": "i"
                }
              },
              {
                name: {
                  "$regex": str,
                  "$options": "i"
                }
              },
              {
                email: {
                  "$regex": str,
                  "$options": "i"
                }
              },
              {
                designation: {
                  "$regex": str,
                  "$options": "i"
                }
              },
              {
                contact: {
                  "$regex": str,
                  "$options": "i"
                }
              },
              {
                subject: {
                  "$regex": str,
                  "$options": "i"
                }
              },
              {
                body: {
                  "$regex": str,
                  "$options": "i"
                }
              },]
            // }
            //]

          }
        );
      approvalQuery = approvalQuery.sort({ [sort]: [order] })
        .skip(pageSize * pageNum)
        .limit(pageSize);
    }
    else {

      approvalQuery = Approval.find(req.userData.zone != 'admin' ? (req.userData.zone != 'Central' ? { zone: req.userData.zone } : { $or: [{ to_central_zone: true }, { zone: "Central" }] }) : {}).find(
        {
          // $or: [
          // { createddate: { $gte: new Date(start), $lt: new Date(end) } },
          //   { createddate: { $gte: ISODate(new Date(start)), $lt: ISODate(new Date(end)) } },

          //  {
          $or: [

            { status: { "$in": req.query.status === 'undefined' && req.query.status === '' ? str : statusstr } },
            { zone: { "$in": req.query.zones === 'undefined' && req.query.zones === '' ? str : zonestr } },
            { approval_type: { "$in": req.query.approvaltype === 'undefined' && req.query.approvaltype === '' ? str : approvaltype } },
            {
              approvalId: {
                "$regex": str,
                "$options": "i"
              }
            },
            {
              name: {
                "$regex": str,
                "$options": "i"
              }
            },
            {
              email: {
                "$regex": str,
                "$options": "i"
              }
            },
            {
              designation: {
                "$regex": str,
                "$options": "i"
              }
            },
            {
              contact: {
                "$regex": str,
                "$options": "i"
              }
            },
            {
              subject: {
                "$regex": str,
                "$options": "i"
              }
            },
            {
              body: {
                "$regex": str,
                "$options": "i"
              }
            },]
          // }
          // ]

        }
      ).sort({ [sort]: [order] })
        .skip(pageSize * pageNum)
        .limit(pageSize);
      //// console.log('inside search')
    }
  }
  else {
    // console.log('load default values');
    approvalQuery = Approval.find(req.userData.zone != 'admin' ? (req.userData.zone != 'Central' ? { zone: req.userData.zone } : {
      $or: [{
        to_central_zone
          : true
      }, { zone: "Central" }]
    }) : {})
      .skip(pageSize * pageNum)
      .limit(pageSize)
      .sort({ [sort]: [order] });
  }
  // Apply date range filter if valid start and end dates are provided
  if (start && end && start !== 'undefined' && end !== 'undefined') {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      approvalQuery = approvalQuery.find({
        date: { $gte: startDate, $lte: endDate }
      });
    }
  }
  approvalQuery
    .then(approval => {
      if (approval) {
        //TODO: Create approval object
        let approvals = [];
        approval.forEach(approval => {
          approvals.push(approval);
          if ("claims" in approval) {
            if (approval.claims.length > 0) {
              approval.claims.forEach(claims => {
                approvals.push(claims);
              });

            }
          }
        });
        //// console.log(approvals);
        res.status(200).json(approvals);
      } else {
        res.status(404).json({
          message: 'Approval not found!',
        });
      }
    })
    .catch(error => {
      // console.log(error);
      res.status(500).json({
        message: 'Fetching Approval falied!'
      });
    });
};

exports.getSingleApproval = (req, res, next) => {
  let id = req.params.id;
  let claimId = req.params.claimId;
  let trackflag = req.params.trackflag;
  // console.log('trackflag',trackflag)
  // console.log('ClaimID',claimId)
  let approvalQuery;
  if (trackflag == "true") {
    // console.log("inside track")
    approvalQuery = Approval.findOne({
      $or: [{ approvalId: id }, {
        'claims': {
          $elemMatch: {
            claimId: id
          }
        }
      }]
    });

  } else {
    // console.log("outside track")
    if (claimId !== undefined && claimId != 'undefined') {
      // console.log("outside track 1")
      approvalQuery = Approval.findOne({
        $and: [{ approvalId: id }, {
          'claims': {
            $elemMatch: {
              claimId: claimId
            }
          }
        }]
      });
    } else
      approvalQuery = Approval.findOne({ approvalId: id });
  }
  approvalQuery
    .then(approval => {
      if (approval) {
        // console.log(approval)
        let index = 0;
        for (i = 0; i < approval.claims.length; i++) {
          if (approval["claims"][i]["claimId"] == claimId || approval["claims"][i]["claimId"] == id)
            index = i;
        }

        //let claimidtrack = approval.claims !== undefined?approval.claims[0].claimId:undefined ;
        if (claimId !== undefined && claimId != 'undefined') {
          // console.log("return 1")
          res.status(200).json(approval.claims[index]);
        } else if (trackflag == "true" && approval["claims"][index] != undefined && approval["claims"][index]["claimId"] == id) {
          // console.log("return 2")
          res.status(200).json(approval.claims[index]);
        }
        else {
          // console.log("return 3")
          res.status(200).json(approval);
        }

      } else {
        res.status(404).json({
          error_message: 'Approval not found!',
        });
      }
    })
    .catch(error => {
      // console.log(error);
      res.status(500).json({
        error_message: 'Fetching Approval falied!'
      });
    });
};

exports.getAwardApproval = (req, res, next) => {
  let id = req.params.id;
  let awardQuery;
  awardQuery = AwardTable.find({ $or: [{ approvalId: id }] });
  awardQuery
    .then(approval => {
      if (approval) {
        res.status(200).json(approval);
      } else {
        res.status(404).json({
          error_message: 'Award not found!',
        });
      }
    })
    .catch(error => {
      // console.log(error);
      res.status(500).json({
        error_message: 'Fetching Award falied!'
      });
    });
};

exports.getUnutilizedamt = (req, res, next) => {
  let id = req.params.id;
  let approvalQuery;
  approvalQuery = Approval.find({ $or: [{ approvalId: id }] });
  approvalQuery
    .then(approval => {
      let unutilized = approval[0].unutilizedamount;
      if (unutilized != '' && unutilized != undefined) {
        let amtvalue = { 'unutilizedamount': unutilized };
        res.status(200).json(amtvalue);
      }
      else if (unutilized == '' || unutilized === undefined) {
        let notapplicable = { 'unutilizedamount': 'NA' };
        res.status(404).json(notapplicable);
      }
      else {
        res.status(404).json({
          error_message: 'Unutilized amount not found!',
        });
      }

    })
    .catch(error => {
      // console.log(error);
      res.status(500).json({
        error_message: 'Fetching Unutilized Amount falied!'
      });
    });
};

exports.getBillApproval = (req, res, next) => {
  let id = req.params.id;
  let billQuery;
  billQuery = Bill.find({ $or: [{ claimId: id }, { approvalId: id }] });
  billQuery
    .then(approval => {
      if (approval) {
        res.status(200).json(approval);
      } else {
        res.status(404).json({
          error_message: 'Bill not found!',
        });
      }
    })
    .catch(error => {
      // console.log(error);
      res.status(500).json({
        error_message: 'Fetching Bill falied!'
      });
    });
};

exports.getSalaryFromApprovalId = (req, res, next) => {
  let id = req.params.id;
  let salaryQuery;
  salaryQuery = Salary.find({ approvalId: id });
  salaryQuery
    .then(approval => {
      if (approval) {
        res.status(200).json(approval);
      } else {
        res.status(404).json({
          error_message: 'Salary not found!',
        });
      }
    })
    .catch(error => {
      // console.log(error);
      res.status(500).json({
        error_message: 'Fetching salary falied!'
      });
    });
};

exports.sendToCentral = (req, res, next) => {
  let istTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  istTime = new Date(istTime);
  const aprovalId = req.body._id;
  console.log("send to central data", req.body);
  pathToAttachment = null;
  file = null;
  original_name = null;
  if (req.file) {
    file = req.file;
    original_name = req.file.originalname;
    pathToAttachment = req.file.location;
  }
  let attachment = "";
  if (pathToAttachment) {
    attachment = `<br> Please see the revised document here: <a href="${pathToAttachment}">${original_name}</a> <br>`;
  } else {
    attachment = `<br> No revised document is attached <br>`;
  }

  //Send Mail
  try {
    const msg = {
      to: req.body.emailId,
      from: "ngoupay@gmail.com",
      subject: `Upay Approval Send to ${req.body.zone} Notification`,
      html: `<p>Upay Approval Send to ${req.body.zone} & track your approval </p>
              Approval Id: ${req.body.approvalId}<br>
              Remarks: ${req.body.remarks}<br>${attachment}
              You can track your approval at <a href='${process.env.CLIENT_URL}/track'>this link</a></p>`
    };
    sgMail.send(msg);
  } catch (e) {
    // console.log("error sending mail: ",e);
    res.status(500).json({
      message: 'Could not send the mail'
    });
  }

  if (req.body.approval_type == 'Claim against advance/PO') {
    // console.log(req.body,"   ",req.userData)
    Approval.updateOne(
      {
        'approvalId': req.body.approvalId,
        'claims': {
          'claims': { $elemMatch: { claimId: req.body.claimId } }
        }
      },
      {
        $set: {
          "claims.$.status": "to " + req.body.zone, to_central_zone: (req.body.zone === 'Central' ? true : false),
          "claims.$.timeline": req.body.timeline + '\n' + req.userData.email + ' sent the approval to ' + req.body.zone + ' at ' + istTime + '.'
        }
      }
    ).then(
      res.status(200).json({
        message: 'Approval Sent!'
      })
    ).catch(err => {
      // console.log(err);
    });

  } else {

    Approval.updateOne({ _id: aprovalId }, {
      status: "to " + req.body.zone, to_central_zone: (req.body.zone === 'Central' ? true : false),
      timeline: req.body.timeline + '\n' + req.userData.email + ' sent the approval to ' + req.body.zone + ' at ' + istTime + '.'
    })
      .then(
        res.status(200).json({
          message: 'Approval Sent!'
        })
      ).catch(err => {
        // console.log(err);
      });
  }
};


exports.sendToAudit = (req, res, next) => {
  let istTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  istTime = new Date(istTime);
  const aprovalId = req.body._id;
  console.log("back send audit" + req.body.emailId);
  pathToAttachment = null;
  file = null;
  orignal_filename = null;
  if (req.file) {
    file = req.file;
    orignal_filename = req.file.originalname;
    pathToAttachment = req.file.location;
  }
  let attachment = "";
  if (pathToAttachment) {
    attachment = `<br> Please see the revised document here: <a href="${pathToAttachment}">${orignal_filename}</a> <br>`;
  } else {
    attachment = `<br> No revised document is attached <br>`;
  }

  //Send Mail
  try {
    const msg = {
      to: req.body.emailId,
      from: "ngoupay@gmail.com",
      subject: 'Upay Approval Audit Notification',
      html: `<p>Upay Approval Audited & track your approval</p>
              Approval Id: ${req.body.approvalId}<br>
              Remarks: ${req.body.remarks}<br>${attachment}
              You can track your approval at <a href='${process.env.CLIENT_URL}/track'>this link</a></p>`
    };
    sgMail.send(msg);
  } catch (e) {
    console.log("error sending mail: ", e);
    res.status(500).json({
      message: 'Could not send the mail'
    });
  }
  //const aprovalId = req.body._id;
  //TODO: Update claims and other approval when notified initiator
  if (req.body.claimId !== undefined) {
    Approval.updateOne({
      approvalId: req.body.approvalId,
      'claims': { $elemMatch: { claimId: req.body.claimId } }
    },
      {
        $set: {
          "claims.$.isAudit": true,
          "claims.$.timeline": req.body.timeline + '\n' + req.userData.email + ' sent the approval with remarks: ' + req.body.remarks + ' at ' + istTime + '.'
        }
      }
    ).then(
      result => {
        if (result.n > 0) {
          res.status(200).json({
            message: 'audited approval '
          });
        }
      }
    )
      .catch(err => {
        res.status(500).json({
          message: 'Could not audit form!'
        });
      });
  } else {
    Approval.updateOne({ _id: aprovalId }, {
      isAudit: true,
      timeline: req.body.timeline + '\n' + req.userData.email + ' the approval mark as audited with remarks: ' + req.body.remarks + ' at ' + istTime + '.'
    }).then(
      result => {
        if (result.n > 0) {
          res.status(200).json({
            message: 'audited approval !'
          });
        }
      }
    )
      .catch(err => {
        res.status(500).json({
          message: 'Could not audit!'
        });
      });
  }
};

exports.forwardApproval = (req, res, next) => {
  let istTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  istTime = new Date(istTime);

  approvalData = JSON.parse(req.body.approvalData);
  console.log("Forward Data: ", approvalData);
  let mailIds = req.body.emailId.split(',');
  console.log(mailIds);
  jwt.sign(
    { aprovalId: approvalData._id, approvalId: approvalData.approvalId, approver: req.body.emailId, claimId: approvalData.claimId || null },
    process.env.EMAIL_KEY,
    { expiresIn: '3d' },
    async (err, emailToken) => {
      const token = emailToken;
      const url = `${process.env.CLIENT_URL}/approve?approvalId=${approvalData.approvalId}&token=${token}&claimId=${approvalData.claimId}`;
      try {
        const msg = {
          to: mailIds,
          from: "ngoupay@gmail.com",
          subject: approvalData && approvalData.approvalId ? `Upay Approval Request - ${approvalData.approvalId}` : "Upay Approval Request",
          html: `<h2>Please approve/reject below request:</h2><br>
          <strong>Below link is valid for 3 days only</strong><br>
          <a href="${url}">Click here to approve or reject</a>`
        };
        await sgMail.send(msg);
        const msg1 = {
          to: approvalData.email,
          from: "ngoupay@gmail.com",
          subject: 'Upay Approval Notification',
          html: `<p>Approval Id: ${approvalData.approvalId}
                  has been forwarded to approver for its approval.  You can track your approval at <a href='${process.env.CLIENT_URL}/track'>this link</a></p>`
        };
        await sgMail.send(msg1);
        scheduleApprovalReminders(approvalData.approvalId, url, mailIds);
      } catch (e) {
        // console.log("error sending mail: ",e);
        res.status(500).json({
          message: 'Approval could not be Send!'
        });
      }
    },
  );

  //// console.log("mail sent");
  //// console.log("req.body.approvalData sendtoapprover",req.body.approvalData)

  if (approvalData.approval_type == 'Claim against advance/PO') {

    Approval.updateOne(
      {
        'approvalId': approvalData.approvalId,
        'claims': {
          $elemMatch: {
            claimId: approvalData.claimId
          }
        }
      },
      {
        $set: {
          "claims.$.status": status.thirteen,
          "claims.$.mediator_remarks": req.body.remarks,
          "claims.$.timeline": approvalData.timeline + '\n' + ' forwarded for approval to ' + mailIds[0] + ' with remarks: ' + req.body.remarks + ', at ' + istTime + '.'
        }
      }
    ).then(async () => {
      let approval = await Approval.findOne({ _id: approvalData._id });
      res.status(200).json({
        message: 'Approval Sent!',
        res: approval
      });
    }
    ).catch(err => {
      // console.log(err);
    });

  } else {
    Approval.updateOne({ _id: approvalData._id }, {
      status: status.thirteen, mediator_remarks: req.body.remarks,
      timeline: approvalData.timeline + '\n' + ' forwarded for approval to ' + req.body.emailId + '\n Remarks: ' + req.body.remarks + ', at ' + istTime + '.'
    }).then(async () => {
      let approval = await Approval.findOne({ _id: approvalData._id });
      res.status(200).json({
        message: 'Approval Sent!',
        res: approval
      });
    }
    ).catch(err => {
      // console.log(err);
    });
  }
};

exports.sendApproval = (req, res, next) => {
  let istTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  istTime = new Date(istTime);
  approvalData = JSON.parse(req.body.approvalData);

  console.log("Data: ", approvalData);
  console.log("send to approver:", req.body.approvalData.claimId || null);
  let mailIds = req.body.emailId.split(',');
  pathToAttachment = null;
  filename = null;
  if (req.file) {
    pathToAttachment = req.file.location;
    filename = req.file.originalname;
  }

  jwt.sign(
    { aprovalId: approvalData._id, approvalId: approvalData.approvalId, approver: req.body.emailId, claimId: approvalData.claimId },
    process.env.EMAIL_KEY,
    { expiresIn: '3d' },
    async (err, emailToken) => {
      const token = emailToken;
      // if(req.body.approvalData.approval_type == 'Claim against advance/PO'){
      //   const url = `${process.env.CLIENT_URL}/approve?approvalId=${req.body.approvalData.approvalId}&token=${token}&claimId=${req.body.approvalData.claimId}`;
      // }else{
      const url = `${process.env.CLIENT_URL}/approve?approvalId=${approvalData.approvalId}&token=${token}&claimId=${approvalData.claimId}`;
      let attachment = "";
      if (pathToAttachment) {
        attachment = `<br> Please see the revised document here: <a href="${pathToAttachment}">${filename}</a> <br>`;
      } else {
        attachment = `<br> No revised document is attached <br>`;
      }
      try {
        const msg = {
          to: mailIds,
          from: "ngoupay@gmail.com",
          subject: approvalData && approvalData.approvalId ? `Upay Approval Request - ${approvalData.approvalId}` : "Upay Approval Request",
          html: `<h2>Please approve/reject below request:</h2><br>
          <strong>Below link is valid for 3 days only</strong><br>
          <a href="${url}">Click here to approve or reject</a>${attachment}`

        };
        await sgMail.send(msg);
        const msg1 = {
          to: req.body.useremailId,
          from: "ngoupay@gmail.com",
          subject: 'Upay Approval Notification',
          html: `<p>Approval Id: ${approvalData.approvalId}
                  has been sent to approver for its approval.  You can track your approval at <a href='${process.env.CLIENT_URL}/track'>this link</a></p>`
        };
        await sgMail.send(msg1);
        scheduleApprovalReminders(approvalData.approvalId, url, mailIds, attachment);
      } catch (e) {
        // console.log("error sending mail: ",e);
        res.status(500).json({
          message: 'Approval could not be Send!'
        });
      }
    },
  );

  if (approvalData.approval_type == 'Claim against advance/PO') {

    Approval.updateOne(
      {
        'approvalId': approvalData.approvalId,
        'claims': {
          $elemMatch: {
            claimId: approvalData.claimId
          }
        }
      },
      {
        $set: {
          "claims.$.status": status.one,
          "claims.$.mediator_remarks": req.body.remarks,
          "claims.$.timeline": approvalData.timeline + '\n' + req.userData.email + ' sent for approve to ' + req.body.emailId + '\n Remarks: ' + req.body.remarks + ', at ' + istTime + '.'
        }
      }
    ).catch(err => {
      // console.log(err);
    });

  } else {
    Approval.updateOne({ _id: approvalData._id }, {
      status: status.one, mediator_remarks: req.body.remarks,
      timeline: approvalData.timeline + '\n' + req.userData.email + ' sent for approve to ' + req.body.emailId + '\n Remarks: ' + req.body.remarks + ', at ' + istTime + '.'
    }).then(
    ).catch(err => {

    });
  }


  res.status(200).json({
    message: 'Approval Sent!'
  });
};

exports.sendToUpdate = (req, res, next) => {
  jwt.sign(
    { approvalId: req.body.approvalId, user: req.body.email },
    process.env.EMAIL_KEY,
    { expiresIn: '3d' },
    async (err, emailToken) => {
      if (err) {
        console.error(err);
        res.status(500).json({
          message: 'Unable to send to update!'
        });
      } else {
        let claims = false;
        let approvalToUpdate = await Approval.findOne({ approvalId: req.body.approvalId });
        if (!approvalToUpdate) {
          approvalToUpdate = await Approval.findOne({ claims: { $elemMatch: { claimId: req.body.approvalId } } });
          claims = true;
        }
        if (!approvalToUpdate) {
          return res.status(404).send('Approval not found');
        }

        if (claims || approvalToUpdate.approval_type === 'Claim against advance/PO') {
          for (let claim of approvalToUpdate.claims) {
            if (claim.claimId === req.body.approvalId) {
              claim.status = "pending for resubmission";
              approvalToUpdate.markModified('claims');
              break;
            }
          }
        } else {
          approvalToUpdate.status = "pending for resubmission";
        }

        await approvalToUpdate.save();

        const token = emailToken;
        const url = `${process.env.CLIENT_URL}/?approvalId=${req.body.approvalId}&claimId=${req.body.claimId}&trackflag=true&token=${token}`;
        try {
          const msg = {
            to: req.body.email,
            from: "ngoupay@gmail.com",
            subject: `Upay Approval Update Request - ${req.body.approvalId}`,
            html: `<h2>Please update below request:</h2><br>
            ${req.body.remarks ? `<div>Remark: ${req.body.remarks}</div>` : ''}
            <strong>Below link is valid for 3 days only</strong><br>
            <a href="${url}">Click here to update</a>`

          };
          await sgMail.send(msg);
        } catch (e) {
          console.log("error sending to update: ", e);
          return res.status(500).json({
            message: 'Unable to send to update!'
          });
        }


        res.status(200).json({
          message: 'Approval sent to update!'
        });
      }
    },
  );
};

exports.confirmation = (req, res, next) => {
  let istTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  istTime = new Date(istTime);
  let user;
  console.log(req.params.status);
  try {
    user = jwt.verify(req.params.token, process.env.EMAIL_KEY);
  } catch (e) {
    return res.status(401).json({ error_message: 'Token Expired. The approval link is valid for 3 days only.' });
  }
  const aprovalId = user.aprovalId;
  // // console.log("user.claimId", user.claimId);

  //TODO: ring the claim id from approve button/ reject button
  // if claim id is not undefined then find it and update the status and timeline
  if (user.claimId !== undefined && user.claimId != 'undefined' && user.claimId != null) {
    console.log("req.params.status", user);
    Approval.findOne({
      approvalId: user.approvalId,
      'claims': { $elemMatch: { claimId: user.claimId } }
    }).then(approval => {
      if (approval) {
        // // console.log("approval",approval)
        Approval.updateOne({
          approvalId: user.approvalId,
          'claims': { $elemMatch: { claimId: user.claimId } }
        },
          {
            $set: {
              "claims.$.status": req.params.status,
              "claims.$.mediator_remarks": req.body.remarks,
              "claims.$.timeline": approval.claims[0].timeline + '\n' + user.approver + ' ' + req.params.status + ' the approval with remark: ' + req.body.remarks + ' at ' + istTime + '.'
            },
            $push: { "actionsBy": user.approver }
          }
        ).then(
          async result => {
            if (result.n > 0) {
              let approval = await Approval.findOne({ _id: aprovalId });
              res.status(200).json({ message: 'Thanks for your response.', res: approval });
            }
            else {
              res.status(401).json({ error_message: 'Not Authorized!' });
            }
          }
        ).catch(err => {
          // console.log(err);
        });

        try {
          const msg1 = {
            to: approval.claims[0].email,
            from: "ngoupay@gmail.com",
            subject: 'Upay Approval Notification',
            html: `<p>Claim Id: ${user.claimId}
                  has been ${req.params.status} by the approver.  You can track your approval at <a href='${process.env.CLIENT_URL}/track'>this link</a></p>`
          };
          sgMail.send(msg1);
        } catch (e) {
          // console.log("error sending mail: ",e);
          res.status(500).json({
            message: 'Approval could not be Send!'
          });
        }
      }
    });

  } else {

    Approval.findOne({ _id: aprovalId }).then(approval => {

      if (approval) {

        Approval.updateOne({ _id: aprovalId },
          {
            status: req.params.status,
            approver_remarks: req.body.remarks,
            timeline: approval.timeline + '\n' + user.approver + ' ' + req.params.status + ' the approval with remark: ' + req.body.remarks + ' at ' + istTime + '.',
            $push: { "actionsBy": user.approver }
          }).then(
            async result => {
              if (result.n > 0) {
                let approval = await Approval.findOne({ _id: aprovalId });
                res.status(200).json({ message: 'Thanks for your response.', res: approval });
              }
              else {
                res.status(401).json({ error_message: 'Not Authorized!' });
              }
            }
          )
          .catch(err => {
            res.status(500).json({
              error_message: 'Could not update approval!'
            });
          });
        try {
          const msg1 = {
            to: approval.email,
            from: "ngoupay@gmail.com",
            subject: 'Upay Approval Notification',
            html: `<p>Approval Id: ${approval.approvalId}
                  has been ${req.params.status} by the approver.  You can track your approval at <a href='${process.env.CLIENT_URL}/track'>this link</a></p>`
          };
          sgMail.send(msg1);
        } catch (e) {
          // console.log("error sending mail: ",e);
          res.status(500).json({
            message: 'Approval could not be Send!'
          });
        }
      }
    });
  }

};

exports.returnEditable = (req, res, next) => {
  let istTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  istTime = new Date(istTime);
  const aprovalId = req.body._id;

  pathToAttachment = null;
  file = null;
  orginal_filename = null;
  if (req.file) {
    file = req.file;
    orginal_filename = req.file.originalname;
    pathToAttachment = req.file.location;
  }
  let attachment = "";
  if (pathToAttachment) {
    attachment = `<br> Please see the revised document here: <a href="${pathToAttachment}">${orginal_filename}</a> <br>`;
  } else {
    attachment = `<br> No revised document is attached <br>`;
  }

  //Send Mail
  try {
    const msg = {
      to: req.body.emailId,
      from: "ngoupay@gmail.com",
      subject: 'Upay Approval Notification Return ',
      html: `<p>Please do correction on your Approval Details as per the below remarks : </p>
              Approval Id: ${req.body.approvalId}<br>
              Claim Id: ${req.body.claimId || '-'}<br>
              Approval type:  ${req.body.approval_type}<br>
              Subject: ${req.body.subject}<br>
              Transfer Status: ${req.body.status}<br>
              Transferred Amount: ${req.body.amount_transferred}<br>
              Remarks: ${req.body.remarks}<br>${attachment}
              You can track your approval at <a href='${process.env.CLIENT_URL}/edit'>this link</a></p>`
    };
    sgMail.send(msg);
  } catch (e) {
    // console.log("error sending mail: ",e);
    res.status(500).json({
      message: 'Could not send the mail to edit form!'
    });
  }
  //const aprovalId = req.body._id;
  //TODO: Update claims and other approval when notified initiator
  if (req.body.claimId !== undefined) {
    Approval.updateOne({
      approvalId: req.body.approvalId,
      'claims': { $elemMatch: { claimId: req.body.claimId } }
    },
      {
        $set: {
          "claims.$.return_editable": true,
          "claims.$.timeline": req.body.timeline + '\n' + req.userData.email + ' notifiied the user with remarks: ' + req.body.remarks + ' with fund transfer status: ' + req.body.status + ' and transferred Amount: ' + req.body.amount_transferred + ', at ' + istTime + '.'
        }
      }
    ).then(
      result => {
        if (result.n > 0) {
          res.status(200).json({
            message: 'Return approval '
          });
        }
      }
    )
      .catch(err => {
        res.status(500).json({
          message: 'Could not edit form!'
        });
      });
  } else {
    Approval.updateOne({ _id: aprovalId }, {
      return_editable: true,
      timeline: req.body.timeline + '\n' + req.userData.email + ' notifiied the user with remarks: ' + req.body.remarks + ' with fund transfer status: ' + req.body.status + ' and transferred Amount: ' + req.body.amount_transferred + ', at ' + istTime + '.'
    }).then(
      result => {
        if (result.n > 0) {
          res.status(200).json({
            message: 'Return approval !'
          });
        }
      }
    )
      .catch(err => {
        res.status(500).json({
          message: 'Could not edit form!'
        });
      });
  }
};

exports.notifyInitiator = (req, res, next) => {
  let istTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  istTime = new Date(istTime);
  const aprovalId = req.body._id;
  if (req.body.po !== undefined) {
    pathToAttachment = null;
    file = null;
    orginal_filename = null;
    if (req.file) {
      file = req.file;
      orginal_filename = req.file.originalname;
      pathToAttachment = req.file.location;
    }
    let attachment = "";
    if (pathToAttachment) {
      attachment = `<br> Please see the revised document here: <a href="${pathToAttachment}">${orginal_filename}</a> <br>`;
    } else {
      attachment = `<br> No revised document is attached <br>`;
    }
    //attachment = fs.readFileSync(pathToAttachment).toString("base64");
    try {
      const msg = {
        to: req.body.emailId,
        from: "ngoupay@gmail.com",
        subject: 'Upay Approval PO',
        html: `<p>Your Approval Details: </p>
                  Approval Id: ${req.body.approvalId}<br>
                  Claim Id: ${req.body.claimId || '-'}<br>
                  Approval type:  ${req.body.approval_type}<br>
                  Subject: ${req.body.subject}<br>
                  Transfer Status: ${req.body.status}<br>
                  Transferred Amount: ${req.body.amount_transferred}<br>
                  Remarks: ${req.body.remarks}<br>
                  You can track your approval at <a href='${process.env.CLIENT_URL}/track'>this link</a><br>${attachment}
                  <div>${req.body.po}</div>
                  `
        //           ,
        // attachments: [
        //   {
        //     content: attachment,
        //     filename: req.file.originalname,
        //     type: "application/pdf",
        //     disposition: "attachment"
        //   }
        // ]
      };
      sgMail.send(msg);
    } catch (e) {
      // console.log("error sending mail: ",e);
      res.status(500).json({
        message: 'Could not send PO to Initiator!'
      });
    }


    Approval.updateOne({ _id: aprovalId }, {
      initiator_notified: true,
      timeline: req.body.timeline + '\n' + req.userData.email + ' notifiied the initiator with remarks: ' + req.body.remarks + ' with fund transfer status: ' + req.body.status + ' and transferred Amount: ' + req.body.amount_transferred + ', at ' + istTime + '.'
    }).then(
      result => {
        if (result.n > 0) {
          res.status(200).json({
            message: 'PO Sent Successfully!'
          });
        }
      }
    )
      .catch(err => {
        res.status(500).json({
          message: 'Could not Send PO to Initiator!'
        });
      });


  } else {
    pathToAttachment = null;
    file = null;
    orginal_filename = null;
    if (req.file) {
      file = req.file;
      orginal_filename = req.file.originalname;
      pathToAttachment = req.file.location;
    }
    let attachment = "";
    if (pathToAttachment) {
      attachment = `<br> Please see the revised document here: <a href="${pathToAttachment}">${orginal_filename}</a> <br>`;
    } else {
      attachment = `<br> No revised document is attached <br>`;
    }

    // attachment = fs.readFileSync(pathToAttachment).toString("base64");
    //Send Mail
    try {
      const msg = {
        to: req.body.emailId,
        from: "ngoupay@gmail.com",
        subject: 'Upay Approval Notification',
        html: `<p>Your Approval Details: </p>
              Approval Id: ${req.body.approvalId}<br>
              Claim Id: ${req.body.claimId || '-'}<br>
              Approval type:  ${req.body.approval_type}<br>
              Subject: ${req.body.subject}<br>
              Transfer Status: ${req.body.status}<br>
              Transferred Amount: ${req.body.amount_transferred}<br>
              Remarks: ${req.body.remarks}<br>${attachment}
              You can track your approval at <a href='${process.env.CLIENT_URL}/track'>this link</a></p>`
        //       ,
        // attachments: [
        //   {
        //     content: attachment,
        //     filename: req.body.approvalId + req.body.subject.slice(0, 40) + ".pdf",
        //     type: "application/pdf",
        //     disposition: "attachment"
        //   }
        // ]
      };
      sgMail.send(msg);
    } catch (e) {
      // console.log("error sending mail: ",e);
      res.status(500).json({
        message: 'Could not notify Initiator!'
      });
    }
    //const aprovalId = req.body._id;
    //TODO: Update claims and other approval when notified initiator
    if (req.body.claimId !== undefined) {
      Approval.updateOne({
        approvalId: req.body.approvalId,
        'claims': { $elemMatch: { claimId: req.body.claimId } }
      },
        {
          $set: {
            "claims.$.initiator_notified": true,
            "claims.$.timeline": req.body.timeline + '\n' + req.userData.email + ' notifiied the initiator with remarks: ' + req.body.remarks + ' with fund transfer status: ' + req.body.status + ' and transferred Amount: ' + req.body.amount_transferred + ', at ' + istTime + '.'
          }
        }
      ).then(
        result => {
          if (result.n > 0) {
            res.status(200).json({
              message: 'Initiator Notified!'
            });
          }
        }
      )
        .catch(err => {
          res.status(500).json({
            message: 'Could not notify Initiator!'
          });
        });
    } else {
      Approval.updateOne({ _id: aprovalId }, {
        initiator_notified: true,
        timeline: req.body.timeline + '\n' + req.userData.email + ' notifiied the initiator with remarks: ' + req.body.remarks + ' with fund transfer status: ' + req.body.status + ' and transferred Amount: ' + req.body.amount_transferred + ', at ' + istTime + '.'
      }).then(
        result => {
          if (result.n > 0) {
            res.status(200).json({
              message: 'Initiator Notified!'
            });
          }
        }
      )
        .catch(err => {
          res.status(500).json({
            message: 'Could not notify Initiator!'
          });
        });
    }
  }
};

exports.fundTransfer = async (req, res, next) => {
  let istTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  istTime = new Date(istTime);
  fundDate = Date.now;
  // console.log("date" + fundDate);
  const approvalId = req.body.approvalData.approvalId;
  let responseFromRazorpay = null;
  if (!req.body.transactionId) {
    responseFromRazorpay = await transferAmountRazorpay(req.body).catch((err) => {
      res.status(500).json({
        isSuccess: false,
        message: 'Could Not Transfer Amount!'
      });
    });
  }
  if (req.body.transactionId || (responseFromRazorpay && responseFromRazorpay.id)) {
    //TODO:update status
    let approval_type = req.body.approvalData.approval_type;
    let transferredAmount = req.body.transferredAmount;

    // console.log("TODO:update status",req.body.approvalData);
    if (approval_type == "Award Approval" || approval_type == "Advance or Imprest") {

      Approval.updateOne({ approvalId: approvalId }, {
        fundTransferDate: istTime,
        status: status.three,
        amount_transferred: transferredAmount,
        transactionId: req.body.transactionId || (responseFromRazorpay && responseFromRazorpay.id ? responseFromRazorpay.id : ""),
        notes: req.body.notes,
        unutilizedamount: transferredAmount,
        timeline: req.body.approvalData.timeline + '\n' + req.userData.email + ` marked ${status.three} with ${req.body.transactionId ? 'transaction Id' : 'razorpay payout Id'}: ` + (req.body.transactionId || (responseFromRazorpay && responseFromRazorpay.id)) + ' and transferred Amount: ' + req.body.transferredAmount + ', at ' + istTime + '.'
      }).then(
        result => {
          if (result.n > 0) {
            res.status(200).json({

              isSuccess: true,
              message: 'Fund Transferred successfully!'
            });
          }
        }
      )
        .catch(err => {
          res.status(500).json({
            isSuccess: false,
            message: 'Amount got transfered but could not mark the approval as Fund Transferred!'
          });
        });
    } else if (approval_type == "Claim against advance/PO") {
      let claimId = req.body.approvalData.claimId;
      let updateclaims = null;
      //Update claims parent data
      Approval.findOne({ approvalId: approvalId }).then(parentapproval => {
        if (parentapproval) {
          let claimamount = parentapproval.claimamount != undefined ? parentapproval.claimamount : 0;
          let unutilizedamount = parentapproval.unutilizedamount != undefined ? parentapproval.unutilizedamount : 0;
          let utilizedamount = parentapproval.utilizedamount != undefined ? parentapproval.utilizedamount : 0;
          let parentrequisiteamount = parentapproval.amount != undefined ? parentapproval.amount : 0;
          let parentamount_transferred = parentapproval.amount_transferred != undefined ? parentapproval.amount_transferred : 0;

          let claimrequisiteamount = req.body.approvalData.amount;
          //claimamount = (claimamount + transferredAmount - unutilizedamount) >= 0?(claimamount + transferredAmount - unutilizedamount):0;
          claimamount = claimamount + transferredAmount;
          utilizedamount = utilizedamount + claimrequisiteamount;
          unutilizedamount = unutilizedamount - (claimrequisiteamount - transferredAmount) > 0 ? unutilizedamount - (claimrequisiteamount - transferredAmount) : 0;
          let parentstatus = null;
          if (parentapproval.approval_type == "Award Approval") {
            if (parentapproval.awardvalue > (claimamount + parentamount_transferred) && claimamount > 0) {
              parentstatus = status.seven;
            } else if (parentapproval.awardvalue > (claimamount + parentamount_transferred) && claimamount == 0) {
              parentstatus = status.six;
            } else if (parentapproval.awardvalue <= (claimamount + parentamount_transferred) && claimamount > 0) {
              parentstatus = status.nine;
            } else if (parentapproval.awardvalue == (claimamount + parentamount_transferred) && claimamount == 0) {
              parentstatus = status.eight;
            }
          } else if (parentapproval.approval_type == "Advance or Imprest") {
            if (parentrequisiteamount > utilizedamount && claimamount > 0) {
              parentstatus = status.seven;
            }
            else if (parentrequisiteamount <= utilizedamount && claimamount > 0) {
              parentstatus = status.nine;
            }
            else if (parentrequisiteamount == utilizedamount && claimamount == 0) {
              parentstatus = status.eight;
            }
            else if (parentrequisiteamount > utilizedamount && claimamount == 0) {
              parentstatus = status.six;
            }
          }

          Approval.updateOne({ approvalId: approvalId }, {
            fundTransferDate: istTime,
            status: parentstatus,
            claimamount: claimamount,
            unutilizedamount: unutilizedamount,
            notes: req.body.notes,
            utilizedamount: utilizedamount,
            timeline: req.body.approvalData.timeline + '\n' + req.userData.email + ` marked ${parentstatus} with ${req.body.transactionId ? 'transaction Id' : 'razorpay payout Id'}: ` + (req.body.transactionId || (responseFromRazorpay && responseFromRazorpay.id)) + ' and transferred Amount: ' + req.body.transferredAmount + ', at ' + istTime + '.'
          })
            .then(
              result => {
                if (result.n > 0) {
                  if (transferredAmount > 0) {
                    updateclaims = {
                      $set: {
                        "claims.$.fundTransferDate": istTime,
                        "claims.$.status": status.five,
                        "claims.$.notes": req.body.notes,
                        "claims.$.amount_transferred": transferredAmount,
                        "claims.$.transactionId": req.body.transactionId || (responseFromRazorpay && responseFromRazorpay.id ? responseFromRazorpay.id : ""),
                        "claims.$.timeline": req.body.approvalData.timeline + '\n' + req.userData.email + ` marked ${status.five} with ${req.body.transactionId ? 'transaction Id' : 'razorpay payout Id'}: ` + (req.body.transactionId || (responseFromRazorpay && responseFromRazorpay.id)) + ' and transferred Amount: ' + req.body.transferredAmount + ', at ' + istTime + '.'

                      }
                    };
                  } else {
                    updateclaims = {
                      $set: {
                        "claims.$.fundTransferDate": istTime,
                        "claims.$.status": status.four,
                        "claims.$.notes": req.body.notes,
                        "claims.$.amount_transferred": transferredAmount,
                        "claims.$.transactionId": req.body.transactionId || (responseFromRazorpay && responseFromRazorpay.id ? responseFromRazorpay.id : ""),
                        "claims.$.timeline": req.body.approvalData.timeline + '\n' + req.userData.email + ` marked ${status.four} with ${req.body.transactionId ? 'transaction Id' : 'razorpay payout Id'}: ` + (req.body.transactionId || (responseFromRazorpay && responseFromRazorpay.id)) + ' and transferred Amount: ' + req.body.transferredAmount + ', at ' + istTime + '.'

                      }
                    };
                  }
                  //Set claim status and amount
                  Approval.updateOne(
                    {
                      'approvalId': approvalId,
                      'claims': {
                        $elemMatch: {
                          claimId: claimId
                        }
                      }
                    },
                    updateclaims
                  ).then(
                    result => {
                      if (result.n > 0) {
                        res.status(200).json({
                          isSuccess: true,
                          message: 'Fund Transferred successfully!'
                        });
                      }
                    }
                  )
                    .catch(err => {
                      res.status(500).json({
                        isSuccess: false,
                        message: 'Amount got transfered but could not mark the claim approval as Fund Transferred!'
                      });
                    });
                }
              }
            )
            .catch(err => {
              res.status(500).json({
                isSuccess: false,
                message: 'Amount got transfered but could not mark the approval as Fund Transferred!'
              });
            });
        }
        else {
          res.status(404).json({
            error_message: 'Approval not found!',
          });
        }


      });

    }
    else {
      console.log("claim body", req.body);
      Approval.updateOne({ approvalId: approvalId }, {
        fundTransferDate: istTime,
        notes: req.body.notes,
        status: status.eight, amount_transferred: req.body.transferredAmount,
        transactionId: req.body.transactionId || (responseFromRazorpay && responseFromRazorpay.id ? responseFromRazorpay.id : ""),
        timeline: req.body.approvalData.timeline + '\n' + req.userData.email + ` marked ${status.eight} with ${req.body.transactionId ? 'transaction Id' : 'razorpay payout Id'}: ` + (req.body.transactionId || (responseFromRazorpay && responseFromRazorpay.id)) + ' and transferred Amount: ' + req.body.transferredAmount + ', at ' + istTime + '.'
      }).then(
        result => {
          if (result.n > 0) {
            res.status(200).json({
              isSuccess: true,
              message: 'Fund Transferred successfully!'
            });
          }
        }
      )
        .catch(err => {
          console.log(err);
          res.status(500).json({
            isSuccess: false,
            message: 'Amount got transfered but could not mark the approval as Fund Transferred!'
          });
        });
    }

  }
};

async function transferAmountRazorpay(details) {
  return new Promise((resolve, reject) => {
    let data = {
      account_number: process.env.RAZORPAY_BUSINESS_NUMBER,
      fund_account_id: details.fund_account_id,
      amount: details.amount,
      currency: "INR",
      mode: details.mode,
      purpose: details.purpose,
      queue_if_low_balance: process.env.RAZORPAY_QUEUE_IF_LOW_BALANCE == true,
      reference_id: details.reference_id,
      narration: details.narration,
      notes: details.notes
    };
    // console.log(data);
    request.post(
      {
        headers: { "Authorization": "Basic " + new Buffer(process.env.RAZORPAY_CLIENT_ID + ':' + process.env.RAZORPAY_CLIENT_PASS).toString("base64") },
        url: process.env.RAZORPAY_PAYOUT_URL,
        body: data,
        json: true
      },
      function (error, response) {
        if (!error && response.statusCode == 200) {
          // console.log(response.body)
          resolve(response.body);
        } else {
          reject(error);
        }
      }
    );
  });
}

exports.getApprovalStatusData = async (req, res, next) => {
  let approvalStatus = {};
  let statuscount = {};
  let index = 0;
  for (const property in status) {
    await Approval.find(req.userData.zone != 'admin' ? (req.userData.zone != 'central' ? { zone: req.userData.zone } : {
      to_central_zone
        : true
    }) : {})
      .find({ status: status[property] }).countDocuments()
      .then(approval => {
        statuscount[property] = approval;
      })
      .catch(error => {
        // console.log(error);
        res.status(500).json({
          message: 'Fetching Approval falied!'
        });
      });
    await Approval.find(req.userData.zone != 'admin' ? (req.userData.zone != 'central' ? { zone: req.userData.zone } : {
      to_central_zone
        : true
    }) : {})
      .find({
        'claims': {
          $elemMatch: {
            status: status[property]
          }
        }
      }).countDocuments()
      .then(approval => {
        statuscount[property] += approval;
      })
      .catch(error => {
        // console.log(error);
        res.status(500).json({
          message: 'Fetching Approval falied!'
        });
      });
  }

  //// console.log('statuscount',statuscount);

  approvalStatus.new = statuscount.zero;
  approvalStatus.pending = statuscount.one;
  approvalStatus.rejected = statuscount.eleven;
  approvalStatus.approved = statuscount.two;
  approvalStatus.transferred = statuscount.three + statuscount.four + statuscount.five + statuscount.six
    + statuscount.seven + statuscount.eight + statuscount.nine + statuscount.twelve;

  res.status(200).json({
    count: approvalStatus
  });
};

exports.deleteApproval = (req, res, next) => {
  // console.log(req.params)
  //TODO: Need to update this api
  if (req.params.claimId != 'undefined') {
    Approval.update({
      $and: [{ approvalId: req.params.approvalId }, {
        'claims': {
          $elemMatch: {
            claimId: req.params.claimId
          }
        }
      }]
    },
      {
        $pull: {
          'claims': {
            'claimId': req.params.claimId
          }
        }
      }
      , { upsert: false, multi: true })
      .then(
        res.status(200).json({
          message: 'Approval deleted!'
        })
      ).catch(err => {
        // console.log(err);
        res.status(500).json({
          message: 'Approval could not be deleted!'
        });
      });
  } else {
    Approval.deleteOne({ approvalId: req.params.approvalId })
      .then(
        res.status(200).json({
          message: 'Approval deleted!'
        })
      ).catch(err => {
        // console.log(err);
        res.status(500).json({
          message: 'Approval could not be deleted!'
        });
      });
  }

};

exports.sendOTP = (req, res, next) => {
  request.get(
    `https://2factor.in/API/V1/${api_key}/SMS/${req.params.contact}/AUTOGEN`,
    function (error, response) {
      if (!error && response.statusCode == 200) {
        res.status(200).json({
          message: 'OTP sent!',
          uri: JSON.parse(response.body).Details
        });
      } else {
        res.status(500).json({
          message: 'OTP could not be sent!'
        });
      }
    }
  );
};

exports.verifyOTP = (req, res, next) => {
  request.get(
    `https://2factor.in/API/V1/${api_key}/SMS/VERIFY/${req.params.id}/${req.params.input}`,
    function (error, response) {
      if (!error && response.statusCode == 200) {
        res.status(200).json({
          message: 'OTP matched!',
          uri: response.body
        });
      } else {
        res.status(500).json({
          message: 'OTP did not match!'
        });
      }
    }
  );
};

exports.sendApprovalReminders = async () => {
  try {
    let reminders = await Reminder.find();
    for (const reminder of reminders) {
      if (reminder.mailIds && reminder.mailIds.length) {
        try {
          let url = new URL(reminder.url);
          let token = url.searchParams.get("token");
          let validToken = false;
          try {
            await jwt.verify(token, process.env.EMAIL_KEY);
            validToken = true;
          } catch {
            validToken = false;
          }

          if (!validToken) {
            await reminder.delete();
            continue;
          }
          let approval = await Approval.findOne({ approvalId: reminder.approvalId });

          if (approval) {
            let actionsBy = approval.actionsBy || [];
            let mailIds = [];
            for (const id of reminder.mailIds) {
              if (!actionsBy.includes(id)) {
                mailIds.push(id);
              }
            }

            if (mailIds.length) {
              let timeLeft = getTimeLeftForTokenExpiration(token);
              let time = "0 minutes";
              if (timeLeft.timeLeftInHours <= 0) {
                time = `${timeLeft.timeLeftInMinutes} minutes`;
              } else {
                if (timeLeft.timeLeftInHours == 1) {
                  time = `${timeLeft.timeLeftInHours} hour`;
                } else {
                  time = `${timeLeft.timeLeftInHours} hours`;
                }
              }
              const msg = {
                to: mailIds,
                from: "ngoupay@gmail.com",
                subject: approval && approval.approvalId ? `Reminder: Your action is pending - ${approval.approvalId}` : "Reminder: Your action is pending",
                html: `<h2>Please approve/reject below request:</h2><br>
                <strong>Below link is valid for ${time} only</strong><br>
                <a href="${url}">Click here to approve or reject</a>${reminder.attachment}`
              };
              await sgMail.send(msg);
            }
          }
        } catch (error) {
          console.log(error);
        }
      }
    }
  } catch (error) {
    console.log("Error in sendApprovalReminders", error);
  }
};

const scheduleApprovalReminders = async (approvalId, url, mailIds, attachment = "<br> No revised document is attached <br>") => {
  try {
    let reminder = new Reminder({
      approvalId, url, mailIds, attachment
    });
    await reminder.save();
  } catch (error) {
    console.log("Error in scheduleApprovalReminders", error);
  }
};

const getTimeLeftForTokenExpiration = (token) => {
  // Split the token into its three parts: header, payload, and signature
  const tokenParts = token.split('.');
  // Extract the payload
  const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString('utf8'));

  // Get the expiration time from the payload
  const expirationTime = payload.exp;

  // Get the current timestamp in seconds
  const currentTime = Math.floor(Date.now() / 1000);

  // Calculate the time left for the token to expire in seconds
  const timeLeftInSeconds = expirationTime - currentTime;

  // Convert the time to a human-readable format (optional)
  const timeLeftInMinutes = Math.floor(timeLeftInSeconds / 60);
  const timeLeftInHours = Math.floor(timeLeftInMinutes / 60);

  return {
    timeLeftInSeconds,
    timeLeftInMinutes,
    timeLeftInHours
  };
};
