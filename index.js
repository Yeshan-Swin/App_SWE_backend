const express = require('express');
const cors = require('cors');
const app = express();
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

dotenv.config();
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URL)
  .then(console.log("Connected to MongoDB"))
  .catch((err) => console.log(err));

app.get("/",(req, res)=>{
  res.status(200).json({message: "Everything is good here"});
})

const PORT = process.env.PORT || 8000;

app.listen(PORT, ()=>{
    console.log(`Backend is running on port ${PORT}`)
});