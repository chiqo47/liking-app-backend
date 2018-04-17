const router = require('express').Router()
const bodyParser = require('body-parser')
const users = require('../models/users')

const isAuthenticated = require('../middleware/isAutheiticated')

router.use(bodyParser.json())
// app.use(bodyParser.urlencoded({extended: true}))

// for testing only
router.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "X-Requested-With")
  next()
})

router.options("/*", function(req, res, next){
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With')
  res.sendStatus(200)
})

router.post('/signup', async (req, res, next) => {
  let {username, password} = req.body
  if (username && password){

    try {
      let existingUser = await users.getByUsername(username)
      if (existingUser){
        let err = new Error('username already exists')
        err.statusCode = 409
        return next(err)
      }

      let user = await users.addUser({username, password})
      delete user.pwdHash
      res.json(user)
    }
    catch (e) {
      next(e)
    }

  }
  else{
    let err = new Error('bad credentials')
    err.statusCode = 400
    next(err)
  }
})

router.post('/login', async (req, res, next) => {
  let {username, password} = req.body
  // console.log(req.body)

  if ( !(username && password)){
    let err = new Error('missing credentials')
    err.statusCode = 400
    return next(err)
  }

  try {
    let user = await users.getByUsername(username)
    if (!user){
      let err = new Error('bad credentials')
      err.statusCode = 400
      return next(err)
    }

    let jwt = await users.authenticate(username, password)
    delete user.pwdHash

    res.json({user, jwt})
  }
  catch (e) {
    next(e)
  }
})

router.get('/me', isAuthenticated, (req, res) => {
  res.status(200).json(req.loggedInUser)
})

router.post('/me/update-password', isAuthenticated, async (req, res, next) => {

  let {currentPassword, newPassword} = req.body

  if (! (currentPassword && newPassword)){

    let err = new Error('missing credentials')
    err.statusCode = 400
    return next(err)
  }

  try {
      let user = await users.getById(req.loggedInUser['_id'])

      let passwordOk = await users.checkPassword(currentPassword, user.pwdHash)

      if (!passwordOk){
        let err = new Error('wrong password')
        err.statusCode = 401
        return next(err)
      }

      let {matchedCount} = await users.setPassword(newPassword, req.loggedInUser['_id'])
      res.sendStatus(matchedCount ? 200 : 404)
  }
  catch (e) {
    next(e)
  }

})

router.get('/user/:id', async (req, res, next) => {

  try {
    let user = await users.getById(req.params.id)
    if (!user)
      return res.status(404).json({error: 'not found'})

    let {username, likedBy = []} = await users.getById(req.params.id)

    let userResponse = {
      username,
      numberOfLikes: likedBy.length
    }
    res.json(userResponse)
  }
  catch (e) {
    next(e)
  }

})

router.post('/user/:id/like', isAuthenticated, async (req, res, next) => {

  try {
    let id = req.params.id
    let likedById = req.loggedInUser['_id']

    let {matchedCount} = await users.likeUser(id, likedById)
    if (matchedCount){
      let updatedUser = await users.getById(id)
      if (updatedUser){
        delete updatedUser.pwdHash
        return res.status(200).json(updatedUser)
      }
    }
    return res.status(404).json({error: 'not found'})
  }
  catch (e) {
    next(e)
  }

})

router.post('/user/:id/unlike', isAuthenticated, async (req, res, next) => {

  try {
    let id = req.params.id
    let likedById = req.loggedInUser['_id']

    let {matchedCount} = await users.unlikeUser(id, likedById)
    if (matchedCount){
      let updatedUser = await users.getById(id)
      if (updatedUser){
        delete updatedUser.pwdHash
        return res.status(200).json(updatedUser)
      }

    }
    return res.status(404).json({error: 'not found'})
  }
  catch (e) {
    next(e)
  }

})

router.get('/most-liked', async (req, res, next) => {

  try {
    let userList = await users.getAllByLikeCount()
    res.json(userList)
  }
  catch (e) {
    next(e)
  }

})

router.use((req, res) => {
  res.status(404).json({error: 'not found'})
})

router.use((err, req, res, next) => {
  // console.log("eeeeeeee")
  // console.error(err)

  if (!err.statusCode)
    err.statusCode = 500

  res.status(err.statusCode)
    .json({error: err.message})
})


module.exports = router
