const Status = require('../models/status');

exports.createStatus = (req, res, next) => {
  const status = new Status({
    statusName: req.body.name
  });
    status.save()
       .then(result => {
         res.status(200).json({
           message: 'Status Created!',
           result: result
         });
       })
       .catch(err => {
         console.log(err);
        res.status(500).json({
            message: 'Status could not be created!'
        });
       });
};

exports.getStatus = (req, res, next) => {
    Status.find()
    .then(status => {
      if(status) {
      res.status(200).json(status);
    } else {
      res.status(404).json({
        message: 'status not found!',
      });
    }
    })
    .catch(error => {
      res.status(500).json({
        message: 'Fetching status falied!'
      })
    });
};

exports.updateStatus = (req, res, next) => {
  Status.updateOne({ _id: req.body.id}, {statusName: req.body.name}).then(
    result => {
      if ( result.n > 0 ) {
        res.status(200).json({message: 'status updated successfully!' });
      }
      else {
        res.status(401).json({message: 'status Not Found!' });
      }
    }
  )
  .catch(err => {
    res.status(500).json({
      message: 'Could not update status!'
    });
  })
};

exports.deleteStatus = (req, res, next) => {
  Status.deleteOne({ _id: req.params.id}).then(
    result => {
      if ( result.n > 0 ) {
        res.status(200).json({message: 'status deleted successfully!' });
      }
      else {
        res.status(401).json({message: 'status Not Found!' });
      }
    }
  )
  .catch(err => {
    res.status(500).json({
      message: 'Could not delete status!'
    });
  })
};
