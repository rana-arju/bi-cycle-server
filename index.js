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

const verifyToken = async(req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({message: 'unauthorize Access'});
    
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded){
    if (err) {
      return res.status(403).send({message: 'forbidden Access'})
    }
    req.decoded = decoded;
    next();
  });

}
async function run() {
  try {
    await client.connect();
    const productsCollection = client.db("products-inventory").collection("haiku");
    const usersCollection = client.db("products-inventory").collection("users");
    // create a document to insert
   
    //User Insert
    app.put('/user/:email',verifyToken, async(req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = {email: email};
      const options = {
        upsert: true
      };
       const updateDoc = {
        $set: user,
    };
    const result = await usersCollection.updateOne(filter, updateDoc, options);
    const token  = await jwt.sign(filter, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: '1d'
    });
    res.send({result, token});
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