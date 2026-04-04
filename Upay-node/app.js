const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const approvalRoutes = require('./routes/approvals');
const userRoutes = require('./routes/users');
const zoneRoutes = require('./routes/zones');
const approverRoutes = require('./routes/approvers');
const schedule = require('node-schedule');
const { sendApprovalReminders } = require('./controllers/approval')
const rule1 = new schedule.RecurrenceRule();
rule1.hour = 7;
rule1.minute = 0;
rule1.tz = 'Asia/Kolkata';
const rule2 = new schedule.RecurrenceRule();
rule2.hour = 20;
rule2.minute = 0;
rule2.tz = 'Asia/Kolkata';

const app = express();

mongoose.connect("mongodb+srv://" + process.env.MONGO_ATLAS_USER + ":" + process.env.MONGO_ATLAS_PW + "@" + process.env.MONGO_ATLAS_CLUSTER + ".mongodb.net/" + process.env.DATABASE + "?retryWrites=true&w=majority")
  .then(() => {
    console.log('Connected to database!');
    schedule.scheduleJob(rule1, sendApprovalReminders);
    schedule.scheduleJob(rule2, sendApprovalReminders);
  })
  .catch((err) => {
    console.log("mongodb+srv://" + process.env.MONGO_ATLAS_USER + ":" + process.env.MONGO_ATLAS_PW + "@" + process.env.MONGO_ATLAS_CLUSTER + "+.mongodb.net/" + process.env.DATABASE + "?retryWrites=true&w=majority");
    console.log('Connection failed!', err);
  });

app.use(bodyParser.json());
app.use('/', express.static(path.join(__dirname, 'angular')));
app.use('/images', express.static(path.join('images')));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT, PATCH, OPTIONS');
  next();
});

app.use('/api/approvals', approvalRoutes);
app.use('/api/user', userRoutes);
app.use('/api/zone', zoneRoutes);
app.use('/api/approver', approverRoutes);
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, "angular", "index.html"));
})

module.exports = app;
