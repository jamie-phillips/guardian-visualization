const fetch = require("node-fetch");
const { RateLimit } = require("async-sema");
require("dotenv").config();

// api key for Guardian Open Platform API
const apiKey = process.env.API_KEY;

// JSON lists of days/months/years which have articles (eg. the ones to search)
let validDays = require("./days.json");
let validMonths = require("./months.json");
let validYears = require("./years.json");

// function to add passed days to a date (uses UTC date to avoid timezone issues)
Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf());
  date.setUTCDate(date.getUTCDate() + days);
  return date;
};

// function to add passed months to a date (uses UTC date to avoid timezone issues)
Date.prototype.addMonths = function (months) {
  var date = new Date(this.valueOf());
  date.setUTCMonth(date.getUTCMonth() + months);
  return date;
};

// function to add passed years to a date (uses UTC date to avoid timezone issues)
Date.prototype.addYears = function (years) {
  var date = new Date(this.valueOf());
  date.setUTCFullYear(date.getUTCFullYear() + years);
  return date;
};

// returns string from toISOString() with varying length depending on interval (eg. interval: "year" => "2000-01-01" => "2000" )
Date.prototype.toISODateString = function (interval) {
  var date = new Date(this.valueOf());
  switch (interval) {
    case "year":
      return date.toISOString().slice(0, 4);
    case "month":
      return date.toISOString().slice(0, 7);
    default:
      return date.toISOString().slice(0, 10);
  }
};

// adds leading zero if num is only 1 digit
function addLeadingZero(num) {
  if (num < 10) {
    return `0${num}`;
  } else {
    return num;
  }
}

// returns formatted string depending on interval (eg. interval: "day" => "2000-02-01" => "01/02/2000")
Date.prototype.toFormattedString = function (interval) {
  var date = new Date(this.valueOf());
  switch (interval) {
    case "year":
      return date.getUTCFullYear();
    case "month":
      return date.toUTCString().slice(8, 16);
    case "day":
      return `${addLeadingZero(date.getUTCDate())}/${addLeadingZero(
        date.getUTCMonth() + 1
      )}/${date.getUTCFullYear()}`;
  }
};

// fetch request from Guardian api using params as URLSearchParams
async function fetchFromGuardian(params) {
  const searchParams = new URLSearchParams(params).toString();
  const url = `https://content.guardianapis.com/search?${searchParams}`;

  const response = await fetch(url);
  return await response.json();
}

// uses Promise.all to fetch multiple requests usings an array of params
async function multipleFetch(params) {
  let response = await Promise.all(
    params.map((param) => fetchFromGuardian(param))
  );
  return response;
}

async function search(search, fromDate, toDate, interval) {
  try {
    let currentDate = new Date(fromDate);
    let endDate = new Date(toDate);
    let searchData = [];
    let results = {};
    results["x"] = [];
    results["y"] = [];
    while (currentDate <= endDate) {
      let searchFromDate = currentDate.toISODateString();
      let searchToDate;
      switch (interval) {
        case "year":
          searchToDate = currentDate.addYears(1).addDays(-1).toISODateString();
          break;
        case "month":
          searchToDate = currentDate.addMonths(1).addDays(-1).toISODateString();
          break;
        case "week":
          break;
        default:
          searchToDate = searchFromDate;
          break;
      }

      // uses checkDate to see if there's articles posted on day, month or year
      if (checkDate(currentDate, interval)) {
        const params = {
          "api-key": apiKey,
          "page-size": 0,
          "from-date": searchFromDate,
          "to-date": searchToDate,
          q: search,
        };
        searchData.push(params);
      } else {
        // if no articles in current time frame then set y to 0
        let resDate = new Date(searchFromDate);
        results["x"].push(resDate.toFormattedString(interval));
        results["y"].push(0);
      }

      // increase currentDate by current interval (eg. +1 day, +1 month or +1 year)
      switch (interval) {
        case "year":
          currentDate = currentDate.addYears(1);
          break;
        case "month":
          currentDate = currentDate.addMonths(1);
          break;
        case "week":
          break;
        default:
          currentDate = currentDate.addDays(1);
          break;
      }
    }

    // 'multipleFetch' 50 api requests at a time
    for (let i = 0; i < searchData.length; i += 50) {
      const paramsArr = searchData.slice(i, i + 50);
      let response = await multipleFetch(paramsArr);
      for (let j = 0; j < paramsArr.length; j++) {
        let count = response[j].response.total;
        let searchDate = paramsArr[j]["from-date"];
        let resDate = new Date(searchDate);
        // format responses to be used with graph on client
        results["x"].push(resDate.toFormattedString(interval));
        results["y"].push(count);
      }
    }
    return results;
  } catch (error) {
    console.log(error);
    return 500;
  }
}

// function checks if date passed is a time frame with articles using validDays, validMonths, and validYears
function checkDate(date, interval) {
  if (date >= new Date("1999-01-01")) {
    return true;
  }
  switch (interval) {
    case "year":
      if (!validYears.includes(date.toISODateString())) {
        return false;
      }
      break;
    case "month":
      if (!validMonths.includes(date.toISODateString())) {
        return false;
      }
      break;
    case "day":
      if (!validDays.includes(date.toISODateString())) {
        return false;
      }
      break;
  }
  return true;
}

// export search to be used in index.js
module.exports = { search };
