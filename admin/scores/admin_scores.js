import { checkAuth } from '../../utils/auth.js'

function validateScore(errObj, score) {
  if (score && !score.match(/^[0-9]+$/)) {
    errObj.success = false
    errObj.message += 'Only numbers are accepted as scores.\n'
  }

  if (parseInt(score) < 0 || parseInt(score) > 10) {
    errObj.success = false
    errObj.message += 'Scores must be between 0 and 10.\n'
  }

  return errObj
}

async function getData() {
  const msgArea = document.getElementById('response-message')

  const response = await fetch('./admin_scores.php')

  if (!response.ok) {
    msgArea.textContent = 'Error fetching data.'
    return false
  }

  // json = { success: boolean, message: string, data: [{gameId: number, username: string, score: number, attemptDate: string}] }
  const json = await response.json()

  if (!json.success) {
    msgArea.textContent = json.message
    return false
  }

  return json.data
}

async function handleDelete(gameId) {
  const msgArea = document.getElementById('response-message')

  const response = await fetch(`./admin_scores.php?gameId=${gameId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    msgArea.textContent = 'Error fetching data.'
    return
  }

  // if successful, this json will contain the updated users information so it can be rendered immediately
  const json = await response.json()

  if (!json.success) {
    // show error message
    msgArea.textContent = json.message
    return
  }

  renderScores(json.data)

  // show success message
  msgArea.textContent = json.message
}

function renderScores(scoresData) {
  // reset any error or success messages
  document.getElementById('response-message').textContent = ''

  const TBODY = document.getElementById('tbody')

  // if TBODY has any data, clear it
  // this is important after making a change, so you don't get row duplication
  TBODY.innerHTML = ''

  for (let i = 0; i < scoresData.length; i++) {
    const trow = document.createElement('tr')

    const rowTemplate = `
      <td id="gameId-${i}">${scoresData[i].gameId}</td>
      <td id="username-${i}">${scoresData[i].username}</td>
      <td id="score-${i}">${scoresData[i].score}</td>
      <td id="attemptDate-${i}">${scoresData[i].attemptDate}</td>
      <td id="editTd-${i}"><button id="editBtn-${i}">E</button></td>
      <td><button id="delBtn-${i}">X</button></td>
    `

    trow.innerHTML = rowTemplate
    TBODY.appendChild(trow)

    // set up del button event
    document
      .getElementById(`delBtn-${i}`)
      .addEventListener('click', () => handleDelete(scoresData[i].gameId))

    document
      .getElementById(`editBtn-${i}`)
      .addEventListener('click', () => handleEditScore(scoresData, i))
  }
}

async function handleSaveEditScore(scoresData, i) {
  const msgArea = document.getElementById('response-message')

  const editedScoreData = {}

  for (const key of Object.keys(scoresData[i])) {
    editedScoreData[key] = document.getElementById(`input-${key}-${i}`).value
  }

  // prevent submission if score isn't valid
  let errObj = { success: true, message: '' }

  errObj = validateScore(errObj, editedScoreData.score)

  if (!errObj.success) {
    msgArea.textContent = errObj.message
    return
  }

  const response = await fetch('./admin_scores.php', {
    method: 'PATCH',
    body: JSON.stringify(editedScoreData),
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    msgArea.textContent = 'Error fetching data.'
    return
  }

  const json = await response.json()

  if (!json.success) {
    // show error message
    msgArea.textContent = json.message
    return
  }

  renderScores(json.data)

  // show success message
  msgArea.textContent = json.message
}

function handleEditScore(scoresData, i) {
  // re-render for the case where someone edits a field while editing a different one
  renderScores(scoresData)

  // insert input into td's
  for (const [key, value] of Object.entries(scoresData[i])) {
    const td = document.getElementById(`${key}-${i}`)
    td.innerHTML = `
      <input 
        type=${typeof value === 'string' ? 'text' : 'number'}
        id='input-${key}-${i}' 
        value=${value}
        ${key === 'gameId' && 'disabled'}
        ${key === 'username' && 'disabled'}
        ${key === 'attemptDate' && 'disabled'}
      >`
  }

  // replace edit button with cancel & save buttons
  const editTd = document.getElementById(`editTd-${i}`)
  editTd.innerHTML = `
      <button type="button" id="cancelBtn">Cancel</button>
      <button type="button" id="saveBtn">Save</button>
    `

  document.getElementById('cancelBtn').addEventListener('click', () => renderScores(scoresData))
  document
    .getElementById('saveBtn')
    .addEventListener('click', () => handleSaveEditScore(scoresData, i))

  document.getElementById(`input-score-${i}`).focus()
}

async function init() {
  // prevent unauthorized users from entering admin area
  checkAuth(true)

  const scoresData = await getData()

  // ie if something went wrong with the database
  if (!scoresData) return

  // print a message if there are no records
  if (scoresData.length < 1) {
    document.getElementById('response-message').textContent = 'no scores recorded.'
    return
  }

  renderScores(scoresData)
}

onload = init
