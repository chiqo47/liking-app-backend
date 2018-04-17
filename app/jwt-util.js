const jwt = require('jsonwebtoken')

const create = user => {
  let payload = {
    _id: user._id,
    username: user.username
  }
  let options = { expiresIn: 7200 }

  return jwt.sign(payload, '513secret632', options)
}

const validate = token => {
  let decoded = null
  try {
    decoded = jwt.verify(token, '513secret632')
  } catch (e) {
    console.log(e)
  }
  return decoded
}

module.exports = {
  create,
  validate
}
