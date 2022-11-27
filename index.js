const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send("Comfore Life server is running")
});

// json web token methods...
app.post('/jwt', (req, res) => {
    const user = req.body;
    const token = jwt.sign(user, process.env.JSON_WEB_TOKEN, { expiresIn: "10h" });
    res.send({ token });
});

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).send({ message: "Unauthorizes access" })
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JSON_WEB_TOKEN, function (err, decoded) {
        if (err) {
            res.status(401).send({ meaasge: "Unauthorizes access" })
        }
        req.decoded = decoded;

    });
    next()
};

// mongoDB 
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.4lqljgn.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        const userCollection = client.db("comfortLife").collection("users");
        const allFurniture = client.db("comfortLife").collection("furnitureItems");
        const furnitureCategories = client.db("comfortLife").collection("categories");
        const orderCollection = client.db("comfortLife").collection("orders");
        const paidFurnitures = client.db("comfortLife").collection("paid");

        // users
        app.post("/users", async (req, res) => {
            const users = req.body;
            const result = await userCollection.insertOne(users);
            res.send(result)
        });

        app.get("/users", async (req, res) => {
            const query = {};
            const users = await userCollection.find(query).toArray();
            res.send(users);
        });

        //delete user
        app.delete("/users/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const users = await userCollection.deleteOne(query);
            res.send(users);
        });

        //verify user
        app.put("/users/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDock = {
                $set: {
                    identity: 'varified',
                }
            }
            const users = await userCollection.updateOne(query, updateDock, options);
            res.send(users);
        });

        // get users by type
        app.get("/users-type/:type", async (req, res) => {
            const type = req.params.type;
            const query = { type: type };
            const users = await userCollection.find(query).toArray();
            res.send(users);
        });

        // get users by email
        app.get("/users/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            res.send(user);
        });

        // furniture categories
        app.get("/categories", async (req, res) => {
            const query = {};
            const categories = await furnitureCategories.find(query).toArray();
            res.send(categories);
        });

        // find category through id
        app.get("/category/:name", async (req, res) => {
            const name = req.params.name;
            const query = { category: name };
            const result = await furnitureCategories.findOne(query);
            res.send(result);
        })

        // find products thorough category name
        app.get("/item/:name", async (req, res) => {
            const name = req.params.name;
            const query = { productName: name };
            const result = await allFurniture.find(query).toArray();
            res.send(result);
        })

        // find product thorough email address
        app.get("/item/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await allFurniture.find(query).toArray();
            res.send(result);
        })

        // get all furniture
        app.get("/furniture", async (req, res) => {
            const query = {};
            const furnitures = await allFurniture.find(query).toArray();
            res.send(furnitures);
        });

        // furniture get thorough email
        app.get("/get-furniture/:id", async (req, res) => {
            const id = req.params.id;
            const query = { previousId: id };
            const furnitures = await orderCollection.findOne(query);
            res.send(furnitures);
        });

        // get furniture by availability
        app.get("/furniture-available", async (req, res) => {
            const query = { isAvailable: "true" };
            const furnitures = await allFurniture.find(query).toArray();
            res.send(furnitures);
        });

        // update product
        app.put("/furniture/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDock = {
                $set: {
                    isAvailable: 'true',
                }
            }
            const furnitures = await allFurniture.updateOne(query, updateDock, options);
            res.send(furnitures);
        });

        // furnitureItems
        app.get("/furniture/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const furnitures = await allFurniture.find(query).toArray();
            res.send(furnitures);
        });

        // add furnitur
        app.post("/furniture", async (req, res) => {
            const furniture = req.body;
            const result = await allFurniture.insertOne(furniture);
            res.send(result);
        });

        // delete furnitur from orders
        app.delete("/furniture/:id", async (req, res) => {
            const id = req.params.id;
            const query = { previousId: id };
            const result = await orderCollection.deleteOne(query);
            res.send(result);
        });

        // deleting after payment
        app.delete("/furniture-delete/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await allFurniture.deleteOne(query);
            res.send(result);
        });

        // add orders
        app.post("/orders", async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        });

        // get orders collection by email
        app.get("/orders", verifyJWT, async (req, res) => {
            const decoded = req.decoded
            const email = req.query.email;
            if (decoded.email !== email) {
                return res.status(401).send({ error: "Email not match" });
            }
            const query = { buyerEmail: email };
            const orders = await orderCollection.find(query).toArray();
            res.send(orders);
        });

        // delete order
        app.delete("/orders/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const orders = await orderCollection.deleteOne(query);
            res.send(orders);
        });

        // payment methods
        app.put("/payment/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDock = {
                $set: {
                    payment: 'true',
                    isAvailable: 'false'
                }
            }
            const paid = await allFurniture.updateOne(query, updateDock, options);
            res.send(paid);
        });

        // paid furnitures
        app.post("/paid", async (req, res) => {
            const furniture = req.body;
            const result = await paidFurnitures.insertOne(furniture);
            res.send(result);
        });

        // paid furnitures
        app.get("/paid/:email", async (req, res) => {
            const email = req.params.email;
            const query = { buyerEmail: email }
            const result = await paidFurnitures.find(query).toArray();
            res.send(result);
        });

        // delete from paid items
        app.delete("/paid/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: id }
            const result = await paidFurnitures.deleteOne(query);
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