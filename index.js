const express = require("express");
const guardian = require("./guardian-search.js");
const fs = require("fs");
const mongodb = require("mongodb");
const schedule = require("node-schedule");
const { text } = require("express");

const app = express();
const port = 3000;
const searchDataFP = "./searchData.json";

app.listen(port, async () => {
  console.log(`Listening on port ${port}`);
  await createIndex();
});

app.use(express.static("public"));

app.get("/api", (req, res) => {
  res.json(req.query);
});

schedule.scheduleJob("0 1 * * *", async () => {
  const searchData = getData(searchDataFP);
  if (searchData != "") {
    const date = searchData.date;
    const success = await guardian.updateDB(new Date(date));
    if (success) {
      const today = new Date();
      const data = {
        date: `${today.getFullYear()}-${
          today.getMonth() + 1
        }-${today.getDate()}`,
      };
      saveData(data, searchDataFP);
    } else {
      console.log(`There was an error updating the database - ${date}`);
    }
  }
});

function saveData(data, filePath) {
  var jsonData = JSON.stringify(data);
  fs.writeFile(filePath, jsonData, function (err) {
    if (err) {
      console.log("There has been an error saving your configuration data.");
      console.log(err.message);
      return;
    }
    console.log("Data saved successfully.");
  });
}

function getData(filePath) {
  var jsonData = fs.readFileSync(filePath),
    data;

  try {
    data = JSON.parse(jsonData);
    console.log("Data read successfully.");
    return data;
  } catch (err) {
    console.log("There has been an error parsing your JSON.");
    console.log(err);
    return "";
  }
}

/*async function createIndex() {
  const dbUrl = "mongodb://127.0.0.1:27017/";

  var MongoClient = mongodb.MongoClient;
  const client = new MongoClient(dbUrl);
  const articlesCollection = client.db("test").collection("testData");
  try {
    await client.connect();
    const result = await articlesCollection.createIndex({
      webPublicationDate: 1,
      webTitle: text,
      bodyTextSummary: text,
    });
    console.log(`Index created successfully: ${result}`);
  } catch (err) {
    console.log(err);
  } finally {
    await client.close();
  }
}*/
