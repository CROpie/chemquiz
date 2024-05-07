async function handleStartGame() {
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo'))
  const username = userInfo.username

  const isDifficult = document.getElementById('difficultyToggle').checked

  const response = await fetch(`../questions/questions.php?isDifficult=${isDifficult}`)

  if (!response.ok) {
    console.log('something went wrong')
    return
  }

  const json = await response.json()

  // error handling here

  // store the questions in session storage
  sessionStorage.setItem('questions', JSON.stringify(json.data))
  window.location.href = '../questions/questions.html'
}

function renderScoreboard(topScores) {
  const TBODY = document.getElementById('scoreboardTbody')

  for (let i = 0; i < topScores.length; i++) {
    const trow = document.createElement('tr')

    const rowTemplate = `
      <td>${topScores[i].username}</td>
      <td>${topScores[i].topScore}</td>
      <td>${topScores[i].attemptDate}</td>
      `

    trow.innerHTML = rowTemplate
    TBODY.appendChild(trow)
  }
}

function renderScores(userScores) {
  const TBODY = document.getElementById('tbody')

  for (let i = 0; i < userScores.length; i++) {
    const trow = document.createElement('tr')

    const rowTemplate = `
      <td>${userScores[i].attemptDate}</td>
      <td>${userScores[i].score}</td>
    `

    trow.innerHTML = rowTemplate
    TBODY.appendChild(trow)
  }
}

function handleLogOut() {
  sessionStorage.clear()
  window.location.href = '../index.html'
}

function init() {
  const highestScores = JSON.parse(sessionStorage.getItem('highestScores'))
  const leaderBoard = JSON.parse(sessionStorage.getItem('leaderBoard'))
  const attemptCount = sessionStorage.getItem('attemptCount')

  if (highestScores) {
    renderScores(highestScores)
  }

  if (leaderBoard) {
    renderScoreboard(leaderBoard)
  }

  if (attemptCount) {
    document.getElementById(
      'total-attempts'
    ).textContent = `Total number of attempts: ${attemptCount}`
  }

  document.getElementById('startBtn').addEventListener('click', handleStartGame)
  document.getElementById('logoutBtn').addEventListener('click', handleLogOut)
}

onload = init
