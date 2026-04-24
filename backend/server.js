"use strict";

const express = require("express");
const exphbs = require("express-handlebars");
const db = require("./models");

const PORT = process.env.PORT || 8080;
const app = express();

// Middleware
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Handlebars setup
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Health check endpoint
app.get("/health", (req, res) => {
  // Check database connectivity
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
    console.log("App listening on PORT " + PORT);
  });
});