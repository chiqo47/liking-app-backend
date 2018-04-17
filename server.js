const express = require('express')
const mongoUtil = require('./app/mongo-util')
const app = express()

const routes = require('./app/routes')

app.use('/', routes);

(async () => {

  try {
    await mongoUtil.connect()

    app.listen(3000, () => {
      console.log('Node.js app is listening at http://localhost:3000')
    })
  }
  catch (e){
    console.log(e)
  }

})()
