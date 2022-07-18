const searchInput = document.getElementById("search");
const fromDateInput = document.getElementById("fromDate");
const toDateInput = document.getElementById("toDate");
const intervalInput = document.getElementById("interval");

document.getElementById("test-button").addEventListener("click", getArticles);

const ctx = document.getElementById("myChart").getContext("2d");
const myChart = new Chart(ctx, {
  type: "bar",
  data: {
    datasets: [
      {
        data: {},
      },
    ],
  },
  options: {
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

  myChart.data.datasets.pop();
  myChart.data.datasets.push({
    data: jsonResponse,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
  });
  myChart.update();
}
