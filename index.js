const express = require("express");
const guardian = require("./guardian-search.js");

const app = express();
const port = 3000;

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
  guardian.updateDB(new Date("1800-01-01"));
});

app.use(express.static("public"));

app.get("/api", (req, res) => {
  res.json(req.query);
});
