async function getData() {
  const response = await fetch('./admin_scores.php')
  if (!response.ok) {
    console.log('something went wrong')
    return
  }

  const json = await response.json()

  return json
}

function renderScores(scoresData) {
  const TBODY = document.getElementById('tbody')

  for (let i = 0; i < scoresData.length; i++) {
    const trow = document.createElement('tr')

    const rowTemplate = `
      <td>${scoresData[i].gameId}</td>
      <td>${scoresData[i].username}</td>
      <td>${scoresData[i].score}</td>
      <td>${scoresData[i].attemptDate}</td>
    `

    trow.innerHTML = rowTemplate
    TBODY.appendChild(trow)
  }
}

async function init() {
  const scoresData = await getData()

  renderScores(scoresData)
}

onload = init
