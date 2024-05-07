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
      <td>${topScores[i].score}</td>
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

function init() {
  const userScores = JSON.parse(sessionStorage.getItem('userScores'))
  console.log(userScores)

  const topScores = [
    { username: 'Chris', score: 10, attemptDate: '2024-04-30' },
    { username: 'Arun', score: 9, attemptDate: '2024-03-12' },
    { username: 'Layan', score: 8, attemptDate: '2024-05-02' },
  ]

  renderScores(userScores)

  renderScoreboard(topScores)

  document.getElementById('startBtn').addEventListener('click', handleStartGame)
}

onload = init
