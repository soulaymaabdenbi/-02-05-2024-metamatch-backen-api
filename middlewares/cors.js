// middleware/cors.js
const cors = require("cors");

const allowedOrigins = ["http://localhost:4200", "http://localhost:5000"]; // Updated to include both ports

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"), false);
    }
  },
  credentials: true, // Enables cookies and auth headers to be included in cross-origin requests
  methods: 'GET, POST, PUT, DELETE, OPTIONS', // Allowed HTTP methods
  allowedHeaders: 'Content-Type, Authorization' // Allowed custom headers
};

module.exports = cors(corsOptions);
