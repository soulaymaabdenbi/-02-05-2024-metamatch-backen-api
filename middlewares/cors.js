// middleware/cors.js
const cors = require("cors");

const allowedOrigins = ["http://localhost:4200", "http://localhost:5000"]; 

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"), false);
    }
  },
  credentials: true, 
  methods: 'GET, POST, PUT, DELETE, OPTIONS', 
  allowedHeaders: 'Content-Type, Authorization' 
};

module.exports = cors(corsOptions);
