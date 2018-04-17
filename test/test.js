const express = require('express')
const config = require('../config')
const mongoUtil = require('../app/mongo-util')
const routes = require('../app/routes')
const users = require('../app/models/users')

const request = require('supertest')
const assert = require('assert')

let server = null

describe('Endpoint tests', function() {

  before(function(done) {
    runTestServer(done)
  })

  after(function(done) {
      if (server)
        server.close(done)
  })


  describe('POST /signup', () => {
    it('can signup to system', async () => {
      await request(server)
        .post("/signup")
        .set('Content-Type', 'application/json')
        .send({"username":"new-demo-user","password":"secret"})
        .expect(200)
        .then(response => assert(!!response.body['_id'], true))
    })
  })

  describe('GET /most-liked', () => {
    it('should responde with an array', async () => {
      await request(server)
        .get("/most-liked")
        .expect(200)
        .then(response => assert(Array.isArray(response.body), true))
    })
  })

  describe('POST /login', () => {
    it('can login to system', async () => {
      await request(server)
        .post("/login")
        .set('Content-Type', 'application/json')
        .send({"username":"new-demo-user","password":"secret"})
        .expect(200)
        .then(response => assert(!!response.body.jwt, true))
    })
  })

  describe('GET /me', () => {
    it('should return 401 when no access token', async () => {
      await request(server)
        .get("/me")
        .expect(401)
    })

    it('should return user data if jwt token is valid', (done) => {
      request(server)
        .post("/login")
        .set('Content-Type', 'application/json')
        .send({"username":"new-demo-user","password":"secret"})
        .expect(200)
        // .then(response => assert(!!response.body.jwt, true))
        .then(response => {
          let jwt = response.body.jwt
          assert(!!response.body.jwt, true)
          // console.log(jwt)
          return request(server)
            .get("/me")
            .expect(200)
            .set('Authorization', jwt)
            .then(r => r.body)
            .then(user => {
              assert(user && user.username != null)
              done()
            })
            .catch(e => done(e))
          //   .expect(200, done)
        })
        // .catch(e => done(e))
    })
  })

  describe('GET /user/:id', () => {
    it('can get user data by id', async () => {

      let users = await request(server)
        .get("/most-liked")
        .expect(200)
        .then(response => {
          assert(Array.isArray(response.body), true)
          return response.body
        })

      let firstUserId = users[0]['_id']
      await request(server)
        .get("/user/" + firstUserId)
        .expect(200)
        .then(r => r.body)
        .then(user => {
          assert(user && user.username != null)
        })
    })
  })

  describe('POST /user/:id/like', () => {
    it('should like the user', async () => {
      let jwt = await request(server)
        .post("/login")
        .set('Content-Type', 'application/json')
        .send({"username":"mike","password":"mikemike"})
        .expect(200)
        .then(response => response.body.jwt)

      let users = await request(server)
        .get("/most-liked")
        .expect(200)
        .then(response => {
          assert(Array.isArray(response.body), true)
          return response.body
        })

      let secondUserId = users[1]['_id']

      await request(server)
        .post(`/user/${secondUserId}/like`)
        .set('Authorization', jwt)
        .expect(200)
    })
  })

  describe('POST /user/:id/unlike', () => {
    it('should like the user', async () => {
      let jwt = await request(server)
        .post("/login")
        .set('Content-Type', 'application/json')
        .send({"username":"mike","password":"mikemike"})
        .expect(200)
        .then(response => response.body.jwt)

      let users = await request(server)
        .get("/most-liked")
        .expect(200)
        .then(response => {
          assert(Array.isArray(response.body), true)
          return response.body
        })

      let secondUserId = users[0]['_id']

      await request(server)
        .post(`/user/${secondUserId}/unlike`)
        .set('Authorization', jwt)
        .expect(200)
    })
  })

  // describe('POST /me/update-password', () => {
  //   it('should return 401 when no access token', async () => {
  //     await request(server)
  //       .get("/me")
  //       .expect(401)
  //   })



  describe('POST /me/update-password', async () => {

    it('should return 401 when no access token', async () => {
      await request(server)
        .post("/me/update-password")
        .expect(401)
    })

    it('should return 400 when missing parameters', async () => {

      let jwt = await request(server)
        .post("/login")
        .set('Content-Type', 'application/json')
        .send({"username":"mike","password":"mikemike"})
        .expect(200)
        .then(response => response.body.jwt)
        .catch(e => console.log(e))

      await request(server)
        .post("/me/update-password")
        .set('Authorization', jwt)
        .send('{"currentPassword":"mike"}')  // no password
        .expect(400)
    })

    it('should return 401 wrong password', async () => {

      let jwt = await request(server)
        .post("/login")
        .set('Content-Type', 'application/json')
        .send({"username":"mike","password":"mikemike"})
        .expect(200)
        .then(response => response.body.jwt)
        .catch(e => console.log(e))

      await request(server)
        .post("/me/update-password")
        .send({"currentPassword": "wrong-password", "newPassword": "new-password"})
        .set('Authorization', jwt)
        .expect(401)
    })

  })




})





const runTestServer = async (done) => {

  const app = express()

  app.use('/', routes);

  (async () => {
    await mongoUtil.connect(
      config.test.dbUrl,
      config.test.dbName
    )

    let db = await mongoUtil.connect()
    await db.collection('users').remove()

    // demo users
    await users.addUser({
      username: 'mike',
      password: 'mikemike',
    })
    await users.addUser({
      username: 'joe',
      password: 'joejoe',
    })

    server = app.listen(3000)
    done()

  })()

}
