
const MongoClient = require('mongodb').MongoClient
const devConfig = require('../config').dev

let db = null

const connect = async (url = devConfig.dbUrl, name = devConfig.dbName) => {
  if (!db) {

    let mongoClient = await MongoClient.connect(url)
    db = mongoClient.db(name)

    console.log(`Connection to mongo server successfull.`)
  }
  return db
}

module.exports = {
  connect,
  getDb: () => db
}
