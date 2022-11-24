const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send("Comfore Life server is running")
});

// mongoDB 
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.4lqljgn.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        const userCollection = client.db("comfortLife").collection("users");
        const furnitureItems = client.db("comfortLife").collection("furnitureItems");

        // users
        app.post("/users" , async (req, res) => {
            const users = req.body;
            console.log(users);
            const result = await userCollection.insertOne(users);
            res.send(result)
        });

        app.get("/users", async (req, res) => {
            const query = {};
            const users = await userCollection.find(query).toArray();
            res.send(users);
        });

        app.get("/users/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            res.send(user);
        });

        // furnitureItems
        app.get("/furniture", async (req, res) => {
            const query = {};
            const furnitures = await furnitureItems.find(query).toArray();
            res.send(furnitures);
        });

        app.get(`/furniture/:id`, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const furniture = await furnitureItems.findOne(query);
            res.send(furniture);
        });

        // add furnitur
        app.post("/furniture", async (req, res) => {
            const furniture = req.body;
            const result = await furnitureItems.insertOne(furniture);
            return res.send(result);
        })

        app.put("/furniture", async (req, res) => {
            const furniture = req.body;
            const query = {};
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    furniture: furniture
                }
            }
            const result = await furnitureItems.updateMany(query, updateDoc, options);
            res.send(result);
        });
    }
    finally {

    }
}
run().catch(err => console.error(err));


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})