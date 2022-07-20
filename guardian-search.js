const fetch = require("node-fetch");
const { RateLimit } = require("async-sema");

const limit = RateLimit(1000, { uniformDistribution: false });

const apiKey = "test";

let validDays = require("./days.json");
let validMonths = require("./months.json");
let validYears = require("./years.json");

Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf());
  date.setUTCDate(date.getUTCDate() + days);
  return date;
};

Date.prototype.addMonths = function (months) {
  var date = new Date(this.valueOf());
  date.setUTCMonth(date.getUTCMonth() + months);
  return date;
};

Date.prototype.addYears = function (years) {
  var date = new Date(this.valueOf());
  date.setUTCFullYear(date.getUTCFullYear() + years);
  return date;
};

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

async function fetchFromGuardian(params) {
  const searchParams = new URLSearchParams(params).toString();
  const url = `https://content.guardianapis.com/search?${searchParams}`;

  const response = await fetch(url);
  return await response.json();
}

async function multipleFetch(params) {
  let response = await Promise.all(
    params.map((param) => fetchFromGuardian(param))
  );
  return response;
}

async function search(search, fromDate, toDate, interval) {
  let currentDate = new Date(fromDate);
  let endDate = new Date(toDate);
  let searchData = [];
  let results = {};
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
      let resDate = new Date(searchFromDate);
      results[resDate.toISODateString(interval)] = 0;
    }

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

  for (let i = 0; i < searchData.length; i += 50) {
    const paramsArr = searchData.slice(i, i + 50);
    let response = await multipleFetch(paramsArr);
    for (let j = 0; j < paramsArr.length; j++) {
      let count = response[j].response.total;
      let searchDate = paramsArr[j]["from-date"];
      let resDate = new Date(searchDate);
      results[resDate.toISODateString(interval)] = count;
    }
  }
  return results;
}

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

module.exports = { search };
