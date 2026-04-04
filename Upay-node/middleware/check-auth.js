const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
  const token = req.headers.authorization.split(' ')[1];
  const decodedToken = jwt.verify(token, 'secrert_text_something_longer');
  req.userData = { email: decodedToken.email, userId: decodedToken.userId, zone:  decodedToken.zone};
  next();
  } catch (error) {
    res.status(401).json({message: 'You are not Authenticated!'});
  }

};
