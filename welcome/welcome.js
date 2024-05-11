import { checkAuth } from '../utils/auth.js'

async function handleStartGame() {
  const isDifficult = document.getElementById('difficultyToggle').checked

  const response = await fetch(`../questions/questions.php?isDifficult=${isDifficult}`)

  if (!response.ok) {
    console.log('something went wrong')
    return
  }

  // json = { success: boolean, message: string, data: question[]
  const json = await response.json()

  // handle fail retrieving questions
  if (!json.success) {
    document.getElementById('message-container').textContent = json.message
    return
  }

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
      <td>${topScores[i].topScore * 10}</td>
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
      <td>${userScores[i].score * 10}</td>
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
  // prevent unauthorized users from entering admin area
  checkAuth()

  const userInfo = JSON.parse(sessionStorage.getItem('userInfo'))

  const highestScores = JSON.parse(sessionStorage.getItem('highestScores'))
  const leaderBoard = JSON.parse(sessionStorage.getItem('leaderBoard'))
  const attemptCount = sessionStorage.getItem('attemptCount')

  document.getElementById('welcome-message').textContent = `Welcome, ${userInfo.username}`

  console.log(userInfo)

  renderScores(highestScores)

  renderScoreboard(leaderBoard)

  document.getElementById(
    'total-attempts'
  ).innerHTML = `Total number of attempts: <span id="total-attempts-num">${attemptCount}</span>`

  document.getElementById('startBtn').addEventListener('click', handleStartGame)
  document.getElementById('logoutBtn').addEventListener('click', handleLogOut)
}

onload = init
