const Zone = require('../models/zone');

exports.createZone = (req, res, next) => {
  const zone = new Zone({
    name: req.body.name
  });
    zone.save()
       .then(result => {
         res.status(200).json({
           message: 'Zone Created!',
           result: result
         });
       })
       .catch(err => {
         console.log(err);
        res.status(500).json({
            message: 'Zone could not be created!'
        });
       });
};

exports.getZone = (req, res, next) => {
  Zone.find()
    .then(zone => {
      if(zone) {
      res.status(200).json(zone);
    } else {
      res.status(404).json({
        message: 'Zone not found!',
      });
    }
    })
    .catch(error => {
      res.status(500).json({
        message: 'Fetching Zone falied!'
      })
    });
};

exports.updateZone = (req, res, next) => {
  Zone.updateOne({ _id: req.body.id}, {name: req.body.name}).then(
    result => {
      if ( result.n > 0 ) {
        res.status(200).json({message: 'Zone updated successfully!' });
      }
      else {
        res.status(401).json({message: 'Zone Not Found!' });
      }
    }
  )
  .catch(err => {
    res.status(500).json({
      message: 'Could not update zone!'
    });
  })
};

exports.deleteZone = (req, res, next) => {
  Zone.deleteOne({ _id: req.params.id}).then(
    result => {
      if ( result.n > 0 ) {
        res.status(200).json({message: 'Zone deleted successfully!' });
      }
      else {
        res.status(401).json({message: 'Zone Not Found!' });
      }
    }
  )
  .catch(err => {
    res.status(500).json({
      message: 'Could not delete zone!'
    });
  })
};
