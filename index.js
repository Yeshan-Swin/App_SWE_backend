const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const apiRouter = require('./routes');

dotenv.config();

const app = express();

const corsOptions = {
  origin: process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : '*',
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

const mongoUrl = process.env.MONGO_URL;
const dbName = process.env.DB_NAME || 'scheduler';

if (!mongoUrl) {
  console.error('Missing required environment variable: MONGO_URL');
  process.exit(1);
}

mongoose
  .connect(mongoUrl, { dbName })
  .then(() => {
    console.log(`Connected to MongoDB database "${dbName}"`);
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });

app.get('/', (_req, res) => {
  res.json({
    message: 'Group Study Scheduler API',
    version: '1.0.0',
    docs: '/docs',
  });
});

app.get("/health",(req, res)=>{
  res.status(200).json({message: "Everything is good here 🙌"});
})

app.use('/api', apiRouter);

app.use((req, res) => {
  res.status(404).json({ detail: 'Not Found' });
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  res.status(status).json({
    detail: err.detail || err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, () => {
  console.log(`Backend is running on port ${PORT}`);
});

process.on('SIGINT', async () => {
  console.log('Shutting down application...');
  await mongoose.connection.close();
  server.close(() => process.exit(0));
});

process.on('SIGTERM', async () => {
  console.log('Termination signal received. Closing application...');
  await mongoose.connection.close();
  server.close(() => process.exit(0));
});

module.exports = app;
