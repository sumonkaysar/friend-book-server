const express = require("express")
const cors = require("cors")
require("dotenv").config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express()
const port = process.env.PORT || 5000

// middleware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zuoxzfe.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {
    const usersCollection = client.db('friendBook').collection('users')
    const postsCollection = client.db('friendBook').collection('posts')

    app.get('/users', async (req, res) => {
      const {uid} = req.query
      const query = { uid: uid }
      const user = await usersCollection.findOne(query)

      res.send(user)
    })

    app.post('/users', async (req, res) => {
      const user = req.body

      const query = { uid: user.uid }
      const userFromDb = await usersCollection.findOne(query)

      if (userFromDb) {
        return res.send({ userExists: true })
      }

      const result = await usersCollection.insertOne(user)

      res.send(result)
    })

    app.get('/posts', async (req, res) => {
      const query = {}
      const posts = await postsCollection.find(query).sort({time: -1}).toArray()

      res.send(posts)
    })

    app.get('/posts/popular', async (req, res) => {
      const query = {}
      const posts = await postsCollection.find(query).sort({'likers': -1}).limit(3).toArray()

      res.send(posts)
    })

    app.post('/posts', async (req, res) => {
      const postData = req.body
      const result = await postsCollection.insertOne(postData)

      res.send(result)
    })

    app.get('/posts/:id', async (req, res) => {
      const {id} = req.params
      const query = {_id: ObjectId(id)}
      const post = await postsCollection.findOne(query)

      res.send(post)
    })

    app.patch('/posts/:id', async (req, res) => {
      const {id} = req.params
      const {liker} = req.body

      const query = { _id: ObjectId(id) }
      let updatedDoc = { }
      const post = await postsCollection.findOne(query)
      if (post.likers?.includes(liker)) {
        updatedDoc = {
          $pull: {likers: liker}
        }
      }else{
        updatedDoc = {
          $push: {likers: liker}
        }
      }

      const result = await postsCollection.updateOne(query, updatedDoc)

      res.send(result)
    })

  } finally { }
}

run().catch(err => console.error(err))

app.get("/", (req, res) => {
  res.send("Friend Book Server is running")
})

app.listen(port, () => console.log("Server is running on port: ", port))