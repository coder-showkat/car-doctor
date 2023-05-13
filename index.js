const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
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
  },
});

// jwt verify access token
const verifyToken = (req, res, next) => {
  const authorization = req.headers.authorization;
  try {
    if (!authorization) throw new Error("unauthorized access");
    const token = authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    if (!decoded) throw new Error("unauthorized access");
    req.decoded = decoded;
    next();
  } catch (error) {
    res.status(401).send({ error: true, message: error.message });
  }
};

const run = async () => {
  await client.connect();
  console.log("Mongodb is connected");

  const Services = client.db("carDoctor").collection("services");

  // jwt generate access token
  app.post("/jwt", (req, res) => {
    const user = req.body;
    const token = jwt.sign(user, process.env.SECRET_KEY, {
      expiresIn: "1h",
    });
    res.send({ token: "Bearer " + token });
  });

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
  app.get("/api/services/:id", async (req, res) => {
    try {
      const _id = new ObjectId(req.params.id);
      const result = await Services.findOne(
        { _id },
        { projection: { title: 1, img: 1, service_id: 1, price: 1 } }
      );
      res.send(result);
    } catch (error) {
      res.status(500).send(error.message);
    }
  });

  // post service to db
  app.post("/api/services", async (req, res) => {
    try {
      const result = await Services.insertOne(req.body);
      res.status(201).send(result);
    } catch (error) {
      res.status(500).send(error.message);
    }
  });

  const Appointments = client.db("carDoctor").collection("appointments");

  // get all appointments for admin
  app.get("/api/admin/appointments", async (req, res) => {
    try {
      const appointments = Appointments.find();
      const result = await appointments.toArray();
      res.send(result);
    } catch (error) {
      res.status(500).send(error.message);
    }
  });

  // get appointments by email
  app.get("/api/appointments", verifyToken, async (req, res) => {
    try {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;
      if (decodedEmail !== email) return res.status(403).send({error: true, message: "forbidden"});
      const appointments = Appointments.find({ email });
      const result = await appointments.toArray();
      res.send(result);
    } catch (error) {
      res.status(500).send(error.message);
    }
  });

  //post appointment to db
  app.post("/api/appointments", async (req, res) => {
    try {
      const result = await Appointments.insertOne({
        ...req.body,
        approved: false,
      });
      res.status(201).send(result);
    } catch (error) {
      res.status(500).send(error.message);
    }
  });

  // delete appointment from db
  app.delete("/api/appointments/:id", async (req, res) => {
    const _id = new ObjectId(req.params.id);
    try {
      const appointment = await Appointments.findOne({ _id });
      if (appointment) {
        const result = await Appointments.deleteOne({ _id });
        res.send(result);
      }
    } catch (error) {
      res.status(500).send(error.message);
    }
  });

  // approve appointment by admin in db
  app.put("/api/admin/appointments/:id", async (req, res) => {
    const _id = new ObjectId(req.params.id);
    try {
      const appointment = await Appointments.findOne({ _id });
      if (appointment) {
        const result = await Appointments.updateOne(
          { _id },
          { $set: { approved: true } },
          { upsert: true }
        );
        res.send(result);
      }
    } catch (error) {
      res.status(500).send(error.message);
    }
  });
};
run();

// home route
app.get("/", (req, res) => {
  res.send("<h1 style='text-align: center;'>Welcome to Car Doctor Server</h1>");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
