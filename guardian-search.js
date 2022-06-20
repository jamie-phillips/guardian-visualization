const fetch = require("node-fetch");
require("dotenv").config();

const apiKey = process.env.API_KEY;

async function updateDB(lastSearchDate) {
  let today = new Date();
  let yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let startYear = lastSearchDate.getFullYear();
  let endYear = yesterday.getFullYear();
  let startMonth;
  let endMonth;
  let startDay;
  let endDay;

  let daysData = [];
  let requestsQueue = [];
  let allResponses = [];

  for (let year = startYear; year <= endYear; year++) {
    startMonth = year == startYear ? lastSearchDate.getMonth() + 1 : 1;
    endMonth = year == endYear ? yesterday.getMonth() + 1 : 12;
    for (let month = startMonth; month <= endMonth; month++) {
      startDay =
        year == startYear && month == startMonth ? lastSearchDate.getDate() : 1;
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
        console.log(`${year}-${month}-${day}`);
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
            "api-key": apiKey,
          });
          total -= pageSize;
          i++;
        }
      }
    }
  }

  let counter = 0;

  for (let i = 0; i < requestsQueue.length; i += 12) {
    let currentRequests = requestsQueue.slice(i, i + 12);
    let responses = await fetchRequests(currentRequests);

    for (let response of responses) {
      console.log(response);
      counter += response.response.pageSize;
    }
    //allResponses = allResponses.concat(responses);
  }
  console.log(counter);
}

async function fetchRequests(requests) {
  let promises = [];
  for (let i = 0; i < requests.length; i++) {
    promises[i] = guardianSearch(requests[i]);
  }

  let values = await Promise.all(promises);
  return values;
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

module.exports = { updateDB };

/* 
TODO:
 - use fetchRequests() for inital totals for each day
 - extract data for each article ready for database
 - input data into database

 - implement search database functionality
*/
