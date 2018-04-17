const jwtUtil = require('../jwt-util')
const users = require('../models/users')

const isAuthenticated = async (req, res, next) => {

  var token = req.headers.authorization
  if (token) {

    let decoded = jwtUtil.validate(token)

    if (decoded){
      try {
        let user = await users.getById(decoded['_id'])

        if (!user){
          let err = new Error('user not found')
          err.statusCode = 401
          return next(err)
        }

        delete user.pwdHash
        req.loggedInUser = user
        next()
      }
      catch(e){
        console.log(e)
        next(e)
      }
    }
  }

  if (!req.loggedInUser){
    let error = new Error('not authorized')
    error.statusCode = 401
    next(error)
  }
}

module.exports = isAuthenticated
