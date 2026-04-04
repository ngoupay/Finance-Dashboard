const Approver = require('../models/approver');

exports.createApprover = (req, res, next) => {
  const approver = new Approver({
    email: req.body.email,
    zone: req.body.zone
  });
  approver.save()
       .then(result => {
         res.status(200).json({
           message: 'Approver Created!',
           result: result
         });
       })
       .catch(err => {
         console.log(err);
        res.status(500).json({
            message: 'Approver could not be created!'
        });
       });
};

exports.getApprover = (req, res, next) => {
  let zone = 'admin'
  if(req.userData != undefined)
    zone = req.userData.zone;
  Approver.find(zone !== 'admin' ? {zone: zone} : {})
    .then(approver => {
      if(approver) {
      res.status(200).json(approver);
    } else {
      res.status(404).json({
        message: 'Approver not found!',
      });
    }
    })
    .catch(error => {
      res.status(500).json({
        message: 'Fetching Approver falied!'
      })
    });
};

exports.updateApprover = (req, res, next) => {
  Approver.updateOne({ _id: req.body.id}, {email: req.body.email, zone: req.body.zone}).then(
    result => {
      if ( result.n > 0 ) {
        res.status(200).json({message: 'Approver updated successfully!' });
      }
      else {
        res.status(401).json({message: 'Approver Not Found!' });
      }
    }
  )
  .catch(err => {
    res.status(500).json({
      message: 'Could not update Approver!'
    });
  })
};

exports.deleteApprover = (req, res, next) => {
  Approver.deleteOne({ _id: req.params.id}).then(
    result => {
      if ( result.n > 0 ) {
        res.status(200).json({message: 'Approver deleted successfully!' });
      }
      else {
        res.status(401).json({message: 'Approver Not Found!' });
      }
    }
  )
  .catch(err => {
    res.status(500).json({
      message: 'Could not delete Approver!'
    });
  })
};
