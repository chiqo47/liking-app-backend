
const MongoClient = require('mongodb').MongoClient
const {url, name} = require('../config').database
// const auth = require('../app/auth')
const users = require('../app/models/users')
const bcrypt = require('bcrypt')


MongoClient.connect(url, async function(err, client) {
  console.log("Connected successfully to server")

  const db = client.db(name)

  db.collection('users').remove()

  await insertUsers(db)
  console.log("Inserted 3 documents into the collection")

  let orderedUsers = await getOrderedUsers(db).toArray()

  console.log(orderedUsers)

  client.close()

})

const user1 = {
  _id: "0",
  username: 'mike',
  password: bcrypt.hashSync('mikemike', 10),
}
const user2 = {
  _id: "1",
  username: 'joe',
  password: bcrypt.hashSync('joejoe', 10),
  likedBy: ["0, 2"]
}
const user3 = {
  _id: "2",
  username: 'jack',
  password: bcrypt.hashSync('jackjack', 10),
  likedBy: ["1", "2", "4"]
}
const user4 = {
  _id: "3",
  username: 'bob',
  password: bcrypt.hashSync('bobbob', 10),
  likedBy: ["0"]
}


const insertUsers = function(db) {
  // Get the documents collection
  const collection = db.collection('users')
  // Insert some documents
  return collection.insertMany([
    user1, user2, user3, user4
  ])
}

const getOrderedUsers = function (db) {

  return db.collection('users').aggregate([
    {
      $addFields: { likeCount: {$size: { $ifNull: [ "$likedBy", [] ] } } }
    },
    {
      $sort: {likeCount: 1}
    }
  ])

}
