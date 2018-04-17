const ObjectId = require('mongodb').ObjectID
const mongoUtil = require('../mongo-util')
const bcrypt = require('bcrypt')
const jwtUtil = require('../jwt-util')


const saltRounds = 10

const getById = id => {
  let db = mongoUtil.getDb()

  return db.collection('users')
    .findOne({_id: ObjectId(id)})
}

const getByUsername = username => {
  let db = mongoUtil.getDb()

  return db.collection('users')
    .findOne({username})
}

const getAll = () => {
  let db = mongoUtil.getDb()

  return db.collection('users')
    .find()
    .toArray()
}

const addUser = async (userData) => {
  if (userData.username && userData.password){
    let db = mongoUtil.getDb()

    let newUser = {
      username: userData.username
    }

    if (userData._id) newUser._id = userData._id
    if (userData.likedBy) newUser.likedBy = userData.likedBy

    let hash = await createPwdHash(userData.password)
    newUser.pwdHash = hash

    let insertResult = await db.collection('users')
      .insertOne(newUser)

    return insertResult.ops[0]
  }
}

const getAllByLikeCount = () => {
  let db = mongoUtil.getDb()

  return db.collection('users').aggregate([
    {
      // $addFields: { likeCount: {$size: { $ifNull: [ "$likedBy", [] ] } } }

      $project: {
        "_id": 1,
        "username": 1,
        "likedBy": 1,
        likeCount: {$size: { $ifNull: [ "$likedBy", [] ] } }
      }
    },
    {
      $sort: {likeCount: -1}
    }
  ]).toArray()
}

const authenticate = async (username, password) => {
  let user = await getByUsername(username)
  // console.log(username, password)
  let passwordOk = await checkPassword(password, user.pwdHash)

  if (!passwordOk){
    let err = new Error('not authorized')
    err.statusCode = 404
    throw err
  }

  return jwtUtil.create(user)
}

const likeUser = async (id, likedById) => {
  let db = mongoUtil.getDb()

  return db.collection('users')
    .updateOne(
      {_id: ObjectId(id)},
      {$addToSet: { likedBy: likedById } }
    )
}

const unlikeUser = async (id, likedById) => {
  let db = mongoUtil.getDb()

  return db.collection('users')
    .updateOne(
      {_id: ObjectId(id)},
      {$pull: { likedBy: likedById } }
    )
}

const createPwdHash = async (plaintextPwd) => {
  return bcrypt.hash(plaintextPwd, saltRounds)
}

const checkPassword = (pwd, hash) => {
  return bcrypt.compare(pwd, hash)
}

const setPassword = async (newPassword, id) => {
  let db = mongoUtil.getDb()

  let pwdHash = await bcrypt.hash(newPassword, saltRounds)

  return db.collection('users')
    .updateOne(
      {_id: ObjectId(id)},
      {$set: { pwdHash } }
    )
}

module.exports = {
  getById,
  getByUsername,
  getAll,
  getAllByLikeCount,
  addUser,
  authenticate,
  likeUser,
  unlikeUser,
  createPwdHash,
  checkPassword,
  setPassword
}
