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
  console.log(url);
  let response = await fetch(url);
  let json = await response.json();
  console.log(json);
}
