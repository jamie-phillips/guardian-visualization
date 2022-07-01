const searchInput = document.getElementById("search");
const fromDateInput = document.getElementById("fromDate");
const toDateInput = document.getElementById("toDate");

document.getElementById("test-button").addEventListener("click", getArticles);

async function getArticles() {
  let search = searchInput.value;
  let fromDate = fromDateInput.value;
  let toDate = toDateInput.value;

  const data = { search, fromDate, toDate };
  let url = "/api?" + new URLSearchParams(data).toString();
  let response = await fetch(url);
  let json = await response.json();
  dateData = getDatesArray(new Date(fromDate), new Date(toDate));
  for (let article of json) {
    let currentDate = article.webPublicationDate.slice(0, 10);
    let dateIndex = dateData.findIndex((i) => i.date === currentDate);
    dateData[dateIndex].count++;
  }
  console.log(dateData);
}

Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

function getDatesArray(startDate, stopDate) {
  var dateArray = new Array();
  var currentDate = startDate;
  while (currentDate < stopDate.addDays(1)) {
    currentDate = new Date(currentDate);
    currentDateStr = currentDate.toISOString().slice(0, 10);
    dateArray.push({ date: currentDateStr, count: 0 });
    currentDate = currentDate.addDays(1);
  }
  return dateArray;
}
