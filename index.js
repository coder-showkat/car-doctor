const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5001;

// middleware
app.use(cors());
app.use(express.json());

// mongodb
const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.bukpahx.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const run = async () => {
    await client.connect();
    console.log("Mongodb is connected");

    const Services = client.db("carDoctor").collection("services");

    // get all services
    app.get("/api/services", async (req, res) => {
        try {
            const services = Services.find();
            const result = await services.toArray();
            res.send(result);
        } catch (error) {
            res.status(500).send(error.message);
        }
    });

    // get service by id
    app.get("/api/services/:id", async (req, res)=> {
        try {
            const _id = new ObjectId(req.params.id);
            const result = await Services.findOne({ _id });
            res.send(result);
        } catch (error) {
            res.status(500).send(error.message);
        }
    })

    // post service to db
    app.post("/api/services", async (req, res) => {
        try {
            const result = await Services.insertOne(req.body);
            res.status(201).send(result);
        } catch (error) {
            res.status(500).send(error.message);
        }
    })
}
run();

// home route
app.get("/", (req, res) => {
  res.send("<h1 style='text-align: center;'>Welcome to Car Doctor Server</h1>");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
