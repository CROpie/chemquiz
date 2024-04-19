async function handleStartGame() {
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo'))
  const username = userInfo.username

  const response = await fetch('../questions/questions.php', {
    method: 'POST',
    body: JSON.stringify({ username }),
    headers: {
      'Content-Type': 'application/json',
    },
  })

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

  renderScores(userScores)

  document.getElementById('startBtn').addEventListener('click', handleStartGame)
}

onload = init
