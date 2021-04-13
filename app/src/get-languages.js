function fireOnReady() {
  const selectSource = document.getElementById("select-source");
  const selectTarget = document.getElementById("select-target");

  let xhttp = new XMLHttpRequest();
  let queryURL = 'http://127.0.0.1:8000/languages'

  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      responseJSON = JSON.parse(this.responseText);
      Object.keys(responseJSON).forEach((key, i) => {
        selectSource.appendChild(new Option(responseJSON[key][0], key));
        selectTarget.appendChild(new Option(responseJSON[key][0], key));
      });
    }
  }

  xhttp.open('GET', queryURL, true)
  xhttp.send()
}
if (document.readyState === "complete") {
  fireOnReady();
} else {
  document.addEventListener("DOMContentLoaded", fireOnReady);
}
