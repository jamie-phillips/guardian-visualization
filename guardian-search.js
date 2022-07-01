const fetch = require("node-fetch");
const sema = require("async-sema");
const mongodb = require("mongodb");
require("dotenv").config();

const apiKey = process.env.API_KEY;
var MongoClient = mongodb.MongoClient;
const dbUrl = "mongodb://127.0.0.1:27017/";
const client = new MongoClient(dbUrl);
const tempCollection = client.db("articles").collection("tempData");
const articlesCollection = client.db("articles").collection("articleData");

const testCollection = client.db("test").collection("testData");

async function searchDB(fromDate, toDate, search) {
  let response = [];
  let ISOfromDate = new Date(fromDate).toISOString();
  let newToDate = new Date(toDate);
  newToDate.setDate(newToDate.getDate() + 1);
  let ISOtoDate = newToDate.toISOString();

  try {
    await client.connect();

    const query = {
      $text: { $search: search },
      webPublicationDate: { $gte: ISOfromDate, $lt: ISOtoDate },
    };
    const sort = { webPublicationDate: 1 };
    const projection = { webPublicationDate: 1 };
    const cursor = articlesCollection
      .find(query)
      .sort(sort)
      .project(projection);
    response = await cursor.toArray();
    console.log(response);
  } catch (err) {
    console.log(err);
  } finally {
    await client.close();
    return response;
  }
}

async function updateDB(lastSearchDate) {
  try {
    // Set yesterday as yesterday's date at 00:00:00
    let today = new Date();
    let yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    // if today has already been searhed then return false
    if (lastSearchDate > yesterday) {
      throw "lastSearchDate is the same or after yesterday's date";
    }

    await client.connect(); // Connect to MongoDB database
    tempCollection.deleteMany({}); // Delete all documents in tempData collection

    let requestsQueue = [];

    let startYear = lastSearchDate.getFullYear();
    let endYear = yesterday.getFullYear();
    let startMonth;
    let endMonth;
    let startDay;
    let endDay;

    for (let year = startYear; year <= endYear; year++) {
      startMonth = year == startYear ? lastSearchDate.getMonth() + 1 : 1;
      endMonth = year == endYear ? yesterday.getMonth() + 1 : 12;
      for (let month = startMonth; month <= endMonth; month++) {
        startDay =
          year == startYear && month == startMonth
            ? lastSearchDate.getDate()
            : 1;
        endDay =
          year == endYear && month == endMonth
            ? yesterday.getDate()
            : daysInMonth(month, year);
        for (let day = startDay; day <= endDay; day++) {
          let date = `${year}-${month}-${day}`;
          let params = {
            "from-date": date,
            "to-date": date,
            "page-size": 1,
            "api-key": apiKey,
          };
          console.log(date);
          let response = await guardianSearch(params);
          let total = response.response.total;
          let i = 1;
          while (total > 0) {
            let pageSize = total > 200 ? 200 : total;
            requestsQueue.push({
              "from-date": date,
              "to-date": date,
              "page-size": pageSize,
              page: i,
              "order-by": "oldest",
              "show-blocks": "body",
              "api-key": apiKey,
            });
            total -= pageSize;
            i++;
          }
        }
      }
    }

    let count = 0;
    while (requestsQueue.length > 0) {
      if (count > 5) {
        throw "Requests failed more than 5 times";
      }
      requestsQueue = await fetchRequests(requestsQueue, tempCollection);
      count++;
    }

    await mergeCollections(articlesCollection, tempCollection);

    client.close();
    return true;
  } catch (e) {
    console.error(e);
    await client.close();
    return false;
  }
}

async function fetchRequests(requestsQueue, collection) {
  noResponseQueue = [];
  for (let i = 0; i < requestsQueue.length; i++) {
    let currentRequest = requestsQueue[i];
    let response = await guardianSearch(currentRequest);
    console.log(response);
    if (response.response.status != "ok") {
      noResponseQueue.push(currentRequest);
    } else {
      let articles = response.response.results;
      let formattedArticles = [];
      for (let article of articles) {
        let bodyTextSummary = "";
        let bodies = article.blocks.body;
        for (let body of bodies) {
          bodyTextSummary += `${body.bodyTextSummary} `;
        }
        let formattedArticle = {
          webTitle: article.webTitle,
          webUrl: article.webUrl,
          apiUrl: article.apiUrl,
          webPublicationDate: article.webPublicationDate,
          bodyTextSummary: bodyTextSummary,
        };
        formattedArticles.push(formattedArticle);
      }
      await inputData(collection, formattedArticles);
    }
  }
  return noResponseQueue;
}

async function guardianSearch(params) {
  let searchParams = new URLSearchParams(params).toString();
  let url = `https://content.guardianapis.com/search?${searchParams}`;
  let response = await fetch(url);
  let json = await response.json();
  return json;
}

function daysInMonth(month, year) {
  let isLeapYear = year % 4 || (year % 100 === 0 && year % 400) ? 0 : 1;
  let daysInMonth =
    month === 2 ? 28 + isLeapYear : 31 - (((month - 1) % 7) % 2);
  return daysInMonth;
}

async function inputData(collection, obj) {
  await collection.insertMany(obj);
}

async function mergeCollections(collection, tempCollection) {
  await collection.insertMany(await tempCollection.find().toArray());
}

module.exports = { updateDB, searchDB };

/* 
TODO:
 - use fetchRequests() for inital totals for each day - DONE
 - extract data for each article ready for database - DONE
 - input data into database - DONE

 - implement search database functionality
*/
