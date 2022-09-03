const primaryColour = getComputedStyle(
  document.documentElement
).getPropertyValue("--primary-colour");
const secondaryColour = getComputedStyle(
  document.documentElement
).getPropertyValue("--secondary-colour");

const searchInput = document.getElementById("search");
const dayButton = document.getElementById("day-btn");
const monthButton = document.getElementById("month-btn");
const yearButton = document.getElementById("year-btn");
const fromDateInput = document.getElementById("fromDate");
const toDateInput = document.getElementById("toDate");
const searchButton = document.getElementById("search-btn");
const chartElement = document.getElementById("guardian-chart").getContext("2d");

let pickLevel;

// sets date pickers as Datepicker objects from vanillajs-datepicker
const fromDatePicker = new Datepicker(fromDateInput, {
  pickLevel: 0,
  autohide: true,
});
const toDatePicker = new Datepicker(toDateInput, {
  pickLevel: 0,
  autohide: true,
});

// addEventListeners to day, month, year button group
changeInterval("day", dayButton);
dayButton.addEventListener("click", function () {
  changeInterval("day", dayButton);
});
monthButton.addEventListener("click", function () {
  changeInterval("month", monthButton);
});
yearButton.addEventListener("click", function () {
  changeInterval("year", yearButton);
});

searchButton.addEventListener("click", getArticles);

// setup guardian chart
Chart.defaults.font.family = "'Archivo', sans serif";
const guardianChart = new Chart(chartElement, {
  type: "bar",
  options: {
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Number of articles containing the keyword "_____" from dd/mm/yyyy to dd/mm/yyy from The Guardian.',
        font: {
          size: 18,
        },
      },
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  },
});

// changeInterval changes the pickLevel of the date pickers and also the format of the date picker placeholders
function changeInterval(interval, button) {
  let format;
  switch (interval) {
    case "year":
      format = "yyyy";
      pickLevel = 2;
      break;
    case "month":
      format = "mm/yyyy";
      pickLevel = 1;
      break;
    default:
      format = "dd/mm/yyyy";
      pickLevel = 0;
      break;
  }

  fromDateInput.placeholder = format;
  toDateInput.placeholder = format;

  fromDatePicker.setOptions({
    pickLevel: pickLevel,
    format: format,
  });
  toDatePicker.setOptions({
    pickLevel: pickLevel,
    format: format,
  });
  pickLevel = interval;
  dayButton.style.background = "white";
  monthButton.style.background = "white";
  yearButton.style.background = "white";
  button.style.background = "lightgray";
}

// getArticles calls api request to /api endpoint to get graph data based off of guardian article data
async function getArticles() {
  guardianChart.data.datasets = [];
  guardianChart.update();
  let search = searchInput.value;
  let fromDate = fromDatePicker.getDate();
  let toDate = toDatePicker.getDate();
  let interval = pickLevel;

  const data = { search, fromDate, toDate, interval };
  let url = "/api?" + new URLSearchParams(data).toString();
  let response = await fetch(url);
  let jsonResponse = await response.json();

  guardianChart.options.plugins.title.text = `Number of articles containing the keyword "${search}" from ${fromDateInput.value} to ${toDateInput.value} from The Guardian.`;
  guardianChart.data.labels = jsonResponse["x"];
  guardianChart.data.datasets.push({
    backgroundColor: primaryColour,
    data: jsonResponse["y"],
  });
  guardianChart.update();
}
