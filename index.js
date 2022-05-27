const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const reviewsCollection = client.db("superCycle").collection("reviews");
    const ordersCollection = client.db("superCycle").collection("orders");
    // create a document to insert
    const verifyAdmin =async(req, res, next)=>{
    const requester = req.decoded.email;
    const requesterAccount = await usersCollection.findOne({email: requester});
    if (requesterAccount.role === 'admin') {
      next();
    }else{
      res.status(403).send({message: "forbidden access"})
    }
}
   //User Get
   app.get('/user',verifyJWT,verifyAdmin, async(req, res) => {
      const users = await usersCollection.find({}).toArray();
      res.send(users);
   });
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
  app.put('/user/admin/:email',verifyJWT,verifyAdmin, async(req, res) => {
      const email = req.params.email;
       const filter = {email: email};
        const updateDoc = {
            $set: {role: 'admin'}
        };
    const result = await usersCollection.updateOne(filter, updateDoc);
    res.send(result);

    
    });
  // Admin Check
  app.get('/admin/:email', async(req, res) => {
    const email = req.params.email;
    const user = await usersCollection.findOne({email:email});
    const isAdmin = user.role === 'admin';
    res.send(isAdmin);
  });
  // Admin Remove
 app.put('/admin/:email',verifyJWT,verifyAdmin, async(req, res) => {
      const email = req.params.email;
       const filter = {email: email};
        const updateDoc = {
            $set: {role: ''}
        };
    const result = await usersCollection.updateOne(filter, updateDoc);
    res.send(result);
    });
  //User Update
   app.put('/user/:email', async(req, res) => {
    const email = req.params.email;
    const user = req.body;
    const filter = {email: email};
    const options = { upsert: true };
    const updateDoc = {
            $set: user
        };
    const result = await usersCollection.updateOne(filter, updateDoc, options);
    res.send(result);    
    });
    //user user details
    app.get('/user/:email', async (req, res) => {
      const email = req.params.email;
      const query = {email:email}
      const user = await usersCollection.findOne(query);
      res.send(user)
    })
    ///Get all Products
  app.get("/allproducts", async(req, res) => {
  const cursor = superCycleCollection.find({});
  const products = await cursor.toArray();
  res.send(products);
});
// Get 6 product Products
  app.get("/products", async(req, res) => {
  const cursor = superCycleCollection.find({});
  const products = await cursor.limit(6).toArray();
 
  res.send(products);
});
//Single Product get
app.get('/products/:id', async(req, res) => {
  const id = req.params.id;
  const query = {_id: ObjectId(id)}
  const result = await superCycleCollection.findOne(query);
  res.send(result);
});
//Delete Product
app.delete('/products/:id', async(req, res) => {
  const id = req.params.id;
  const query = {_id: ObjectId(id)}
  const result = await superCycleCollection.deleteOne(query);
  res.send(result);
});
//insert new product
app.post('/products', async(req, res) => {
  const product = req.body;
  const result = await superCycleCollection.insertOne(product);
  res.send(result);

});
//Get Review
app.get('/review', async(req, res) => {
  const cursor = reviewsCollection.find({});
  const reviews = await cursor.toArray();
  res.send(reviews);
})
//post Review
app.post('/review', async(req, res) => {
  const review = req.body;
  const result = await reviewsCollection.insertOne(review);
  res.send(result);
});
//order
// Post an order
app.post('/order',verifyJWT, async(req, res) => {
  const order = req.body;
  const result = await ordersCollection.insertOne(order);
  res.send(result);
});
// Get order product filter by email
app.get('/order/:email', async(req, res) => {
    const email = req.params.email;
    const cursor = await ordersCollection.find({email:email});
    const orders = await cursor.toArray();
    res.send(orders)
});
// Get order product filter by email
app.get('/order', async(req, res) => {
  const cursor = await ordersCollection.find().toArray();
  res.send(cursor);
});


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