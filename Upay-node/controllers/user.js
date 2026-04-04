const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.signup = (req, res, next) => {
  bcrypt.hash(req.body.password, 10)
    .then(hash => {
      const user = new User({
        email: req.body.email,
        password: hash,
        zone: req.body.zone,
        reviewadmin: req.body.reviewadmin || 'false'
      });
      user.save()
       .then(result => {
         res.status(200).json({
           message: 'User Created!',
           result: result
         });
       })
       .catch(err => {
         console.log(err);
        res.status(500).json({
            message: 'User could not be created!'
        });
       });
    });
};

exports.login = (req, res, next) => {
  let fetchedUser;
  User.findOne( {email: req.body.email} )
    .then(user => {
      if (!user) {
        return res.status(401).json({
          message: "Auth failed!"
        });
      }
      fetchedUser = user;
      console.log(fetchedUser);
      return bcrypt.compare(req.body.password, user.password);
    })
    .then(result => {
      //console.log(result);
      if (!result) {
        return res.status(401).json({
          message: "Auth failed!123"
        });
      }
      const token = jwt.sign(
        {email: fetchedUser.email, userId: fetchedUser._id, zone: fetchedUser.zone, reviewadmin: fetchedUser.reviewadmin},

        'secrert_text_something_longer',
        { expiresIn: '1h' }
        );
        res.status(200).json({
          token: token,
          expiresIn: 3600,
          userId: fetchedUser._id
        });
    })
    .catch(err => {
      return res.status(401).json({
        message: "Invalid Authentication credentials!"
      });
    })
};

exports.getUser = (req, res, next) => {
  User.find()
    .then(user => {
      if(user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({
        message: 'User not found!',
      });
    }
    })
    .catch(error => {
      res.status(500).json({
        message: 'Fetching User falied!'
      })
    });
};

exports.updateUser = (req, res, next) => {
  User.updateOne({ _id: req.body.id}, {email: req.body.email, zone: req.body.zone, reviewadmin: req.body.reviewadmin}).then(
    result => {
      if ( result.n > 0 ) {
        res.status(200).json({message: 'User updated successfully!' });
      }
      else {
        res.status(401).json({message: 'User Not Found!' });
      }
    }
  )
  .catch(err => {
    res.status(500).json({
      message: 'Could not update User!'
    });
  })
};

exports.resetPassword = (req, res, next) => {
  bcrypt.hash(req.body.password, 10)
  .then(hash => {
    User.updateOne({ _id: req.body.id}, {password: hash}).then(
      result => {
        if ( result.n > 0 ) {
          res.status(200).json({message: 'Password updated successfully!' });
        }
        else {
          res.status(401).json({message: 'User Not Found!' });
        }
      }
    )
    .catch(err => {
      res.status(500).json({
        message: 'Could not update Password!'
      });
    })
  });
};

exports.deleteUser = (req, res, next) => {
  User.deleteOne({ _id: req.params.id}).then(
    result => {
      if ( result.n > 0 ) {
        res.status(200).json({message: 'User deleted successfully!' });
      }
      else {
        res.status(401).json({message: 'User Not Found!' });
      }
    }
  )
  .catch(err => {
    res.status(500).json({
      message: 'Could not delete User!'
    });
  })
};