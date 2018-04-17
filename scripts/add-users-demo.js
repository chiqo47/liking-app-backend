const ObjectId = require('mongodb').ObjectID
const config = require('../config')
const mongoUtil = require('../app/mongo-util')
const users = require('../app/models/users')

;(async () => {
  let db = await mongoUtil.connect()

  db.collection('users').remove()

  let result = await users.addUser({
    // _id: ObjectId("0"),
    username: 'mike',
    password: 'mikemike',
    // likedBy: ["1", "2"]
  })

  await users.addUser({
    // _id: ObjectId("1"),
    username: 'joe',
    password: 'joejoe',
    // likedBy: ["0"]
  })

  await users.addUser({
    // _id: ObjectId("2"),
    username: 'jack',
    password: 'jackjack'
  })

  await users.addUser({
    // _id: ObjectId("3"),
    username: 'bob',
    password: 'bobbob',
    // likedBy: ["1", "2", "3"]
  })

  console.log(result.insertedId)

  // let insertedId = result.insertedIds[0]
  // let samePwd = await users.checkPassword('mikemike', insertedId)
  // console.log(samePwd)

})()
