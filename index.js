const express = require("express");
const guardian = require("./guardian-search.js");

const app = express();
const port = 3000;

app.listen(port, async () => {
  console.log(`Listening on port ${port}`);
});

app.use(express.static("public"));

// open api end point for guardian search
app.get("/api", async (req, res) => {
  console.log("Request recieved");
  const fromDate = req.query.fromDate;
  const toDate = req.query.toDate;
  const search = req.query.search;
  const interval = req.query.interval;
  let searchRes = await guardian.search(search, fromDate, toDate, interval);
  if (searchRes == 500) {
    res.status(500);
  } else {
    res.json(searchRes);
  }
  console.log("Response sent");
});
