async function handleDelete(gameId) {
  const response = await fetch(`./admin_scores.php?gameId=${gameId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    console.log('something went wrong...')
    return
  }

  // if successful, this json will contain the updated users information so it can be rendered immediately
  const json = await response.json()

  renderScores(json)

  console.log(json)
}

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

  // if TBODY has any data, clear it
  // this is important after making a change, so you don't get row duplication
  TBODY.innerHTML = ''

  for (let i = 0; i < scoresData.length; i++) {
    const trow = document.createElement('tr')

    const rowTemplate = `
      <td>${scoresData[i].gameId}</td>
      <td>${scoresData[i].username}</td>
      <td>${scoresData[i].score}</td>
      <td>${scoresData[i].attemptDate}</td>
      <td><button id="delBtn-${i}">X</button></td>
    `

    trow.innerHTML = rowTemplate
    TBODY.appendChild(trow)

    // set up del button event
    document
      .getElementById(`delBtn-${i}`)
      .addEventListener('click', () => handleDelete(scoresData[i].gameId))
  }
}

async function init() {
  const scoresData = await getData()

  renderScores(scoresData)
}

onload = init
