"use strict";

const express = require("express");
const exphbs = require("express-handlebars");
const db = require("./models");

const PORT = process.env.PORT || 8080;
const app = express();

// CORS — allow origins listed in ALLOWED_ORIGINS env var (comma-separated)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost")
  .split(",")
  .map(o => o.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Structured JSON request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    console.log(JSON.stringify({
      time: new Date().toISOString(),
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration_ms: Date.now() - start,
      ip: req.ip
    }));
  });
  next();
});

// Middleware
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Handlebars setup
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Health check endpoint
app.get("/health", (req, res) => {
  db.sequelize.query("SELECT 1 as health")
    .then(() => {
      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "connected"
      });
    })
    .catch(err => {
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: err.message
      });
    });
});

// API routes
require("./routes/cart-api-routes")(app);
app.use("/", require("./routes/html-routes"));
app.use("/cart", require("./routes/html-routes"));
app.use("/gallery", require("./routes/html-routes"));

// Sync database and start server
db.sequelize.sync().then(function () {
  app.listen(PORT, function () {
    console.log(JSON.stringify({ time: new Date().toISOString(), event: "server_start", port: PORT }));
  });
});
