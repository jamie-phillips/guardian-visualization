const searchInput = document.getElementById("search");
const fromDateInput = document.getElementById("fromDate");
const toDateInput = document.getElementById("toDate");
const intervalInput = document.getElementById("interval");

const fromDatePicker = new Datepicker(fromDateInput, {
  pickLevel: 0,
});
const toDatePicker = new Datepicker(toDateInput, {
  pickLevel: 0,
});

document.getElementById("search-button").addEventListener("click", getArticles);

Chart.defaults.font.family = "'Archivo', sans serif";

const chartElement = document.getElementById("guardian-chart").getContext("2d");
const guardianChart = new Chart(chartElement, {
  type: "bar",
  data: {
    datasets: [
      {
        data: {},
      },
    ],
  },
  options: {
    maintainAspectRatio: false,
    plugins: {
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

async function getArticles() {
  let search = searchInput.value;
  let fromDate = fromDateInput.value;
  let toDate = toDateInput.value;
  let interval = intervalInput.value;

  const data = { search, fromDate, toDate, interval };
  let url = "/api?" + new URLSearchParams(data).toString();
  let response = await fetch(url);
  let jsonResponse = await response.json();

  guardianChart.data.datasets.pop();
  guardianChart.data.datasets.push({
    data: jsonResponse,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
  });
  guardianChart.update();
}
