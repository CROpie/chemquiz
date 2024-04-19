function renderScore(score) {
  const MAIN = document.getElementById('main')

  const scoreTemplate = `
        <h3>You scored: ${score}</h3>
    `

  MAIN.innerHTML = scoreTemplate
}

function init() {
  const playerScore = JSON.parse(sessionStorage.getItem('playerScore'))

  renderScore(playerScore.score)
}

onload = init
