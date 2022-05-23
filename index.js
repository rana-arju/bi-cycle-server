const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;
//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sptt8.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];
    if (!authHeader) {
      return res.status(404).send({message: "Unauthorize access"})
    }
    if (token) {
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded) {
        if (err) {
          return res.status(403).send({message: "Forbidden access"})
        }
   req.decoded= decoded;
   next();
});
    }
    
}
async function run() {
  try {
    await client.connect();
    const superCycleCollection = client.db("superCycle").collection("products");
    const usersCollection = client.db("superCycle").collection("users");
    // create a document to insert
   //User Get
   app.get('/user',verifyJWT, async(req, res) => {
      const users = await usersCollection.find().toArray();
      res.send(users);
   })
    //User Insert/Update
  app.put('/user/:email', async(req, res) => {
    const email = req.params.email;
    const user = req.body;
    const filter = {email: email};
    const options = { upsert: true };
     const updateDoc = {
      $set: user
    };
    const result = await usersCollection.updateOne(filter, updateDoc, options);
    const token = jwt.sign(filter, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1d'});
    res.send({result, token});
  });
  //Make Admin
      app.put('/user/admin/:email', async(req, res) => {
        const email = req.params.email;
        const filter = {email: email};
        const updateDoc = {
          $set: {role: 'admin'}
        };
        const result = await usersCollection.updateOne(filter, updateDoc, options);
        res.send(result);
    });
    ///Products
  app.get("/products", async(req, res) => {
  const cursor = superCycleCollection.find({});
  const products = await cursor.toArray();
 
  res.send(products);
})
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('server is running....')
});
app.listen(port, () => {
    console.log('server is running port of', port);
})