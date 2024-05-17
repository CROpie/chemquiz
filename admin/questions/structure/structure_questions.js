import { initRDKit, safelyGenerateStructure } from '../../../utils/rdkit.js'
import { initializeJsme, getJsme, getJsmeApplet, hideJsme } from '../../../utils/jsme.js'
import { checkAuth } from '../../../utils/auth.js'

/* VALIDATION */
function validateQuestion(errObj, editData) {
  // if no structure drawn
  if (!editData.molecule) {
    errObj.success = false
    errObj.message += 'Please draw a structure.'
  }
  // check if any of the 4 options are identical, by adding to a set
  // if the size of the set < 4, then there was a duplicate or they weren't filled out
  const answerAndQuestions = new Set()
  answerAndQuestions.add(editData.answer)
  answerAndQuestions.add(editData.incorrect1)
  answerAndQuestions.add(editData.incorrect2)
  answerAndQuestions.add(editData.incorrect3)

  if (answerAndQuestions.size < 4) {
    errObj.success = false
    errObj.message += 'You must fill out all input fields, and they must all be unique.\n'
  }

  return errObj
}

/* FETCH FUNCTIONS */
async function getData() {
  const msgArea = document.getElementById('response-message')

  const response = await fetch('structure_questions.php')

  if (!response.ok) {
    msgArea.textContent = 'Error fetching data.'
    return false
  }

  const json = await response.json()

  if (!json.success) {
    msgArea.textContent = json.message
    return false
  }

  return json.data
}

// both new reactions and edited reactions submit through this function
async function handleSubmit(session) {
  const msgArea = document.getElementById('response-message')

  const { editData } = session.getState()

  // prevent submission if question isn't valid
  let errObj = { success: true, message: '' }

  errObj = validateQuestion(errObj, editData)

  if (!errObj.success) {
    msgArea.textContent = errObj.message
    return
  }

  const response = await fetch('./structure_questions.php', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(editData),
  })

  if (!response.ok) {
    msgArea.textContent = 'Error fetching data.'
    return false
  }

  const json = await response.json()

  if (!json.success) {
    msgArea.textContent = json.message
    return false
  }

  session.init(json.data)

  // Don't really like how success message looks. Would be better as a toast..
  // msgArea.textContent = json.message
}

async function handleDeleteItem(session, structureId) {
  const msgArea = document.getElementById('response-message')

  const response = await fetch(`structure_questions.php?structureId=${structureId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    msgArea.textContent = 'Error fetching data.'
    return false
  }

  const json = await response.json()

  if (!json.success) {
    msgArea.textContent = json.message
    return false
  }

  // call render with updated data
  session.init(json.data)

  // Don't really like how success message looks. Would be better as a toast..
  // msgArea.textContent = json.message
}

/* RENDER FUNCTIONS */
// will be "new" or the particular reactionId
function renderEditable(session) {
  const { editData, editRow } = session.getState()

  hideJsme()
  getJsmeApplet().reset()

  const template = `
  <div id="${editRow}-molecule-input-container"></div>
  <div class="options-container">
    <label class="correct-label" for="${editRow}-answer">Answer</label>
    <input class="new-input" id="${editRow}-answer" type="text" value="${editData.answer}"/>

    <label class="incorrect-label">Incorrect Answers</label>
    <input class="new-input" id="${editRow}-incorrect1" type="text" value="${editData.incorrect1}"/>
    <input class="new-input" id="${editRow}-incorrect2" type="text" value="${editData.incorrect2}"/>
    <input class="new-input" id="${editRow}-incorrect3" type="text" value="${editData.incorrect3}"/>
    <div>
      <label class="difficulty-label" for="${editRow}-difficulty-checkbox">Difficult Question?</label>
      <input type="checkbox" id="${editRow}-difficulty-checkbox" ${
    editData.difficulty === '1' ? 'checked' : ''
  } />
    </div>
  </div>
      ${
        editRow === 'new'
          ? `
      <div class="buttons-container">
        <button id="new-submitBtn">Submit</button>
      </div>
      `
          : `
      <div class="buttons-container">
        <button id="${editRow}-editBtn" disabled>Edit</button>
        <button id="${editRow}-submitBtn">Submit</button>
        <button id="${editRow}-cancelBtn">Cancel</button>
      </div>
      `
      }
        `

  document.getElementById(`${editRow}-structureQ-container`).innerHTML = template

  /* SET UP JSME */
  const moleculeInputContainer = document.getElementById(`${editRow}-molecule-input-container`)

  // remove the SVG if present
  moleculeInputContainer.innerHTML = ''

  // move JSME to where the SVG was
  moleculeInputContainer.appendChild(getJsme())

  // recreate the molecule and insert it in JSME
  getJsmeApplet().readGenericMolecularInput(editData.molecule)

  /* EVENTS */

  // difficulty checkbox
  // document
  //   .getElementById(`${editRow}-difficulty-checkbox`)
  //   .addEventListener('change', () => session.handleDifficultyCheckbox())

  // set up events for the right-hand-side buttons (submit, cancel)
  document
    .getElementById(`${editRow}-submitBtn`)
    .addEventListener('click', () => session.collectAndSubmit())

  // list only buttons
  if (editRow !== 'new') {
    document
      .getElementById(`${editRow}-cancelBtn`)
      .addEventListener('click', () => session.handleClickRow('new'))
  }
}

// the new input area is rendered with this function when an existing reaction is being edited
function renderBigButton(session) {
  const newStructureQContainer = document.getElementById('new-structureQ-container')

  newStructureQContainer.style.display = 'block'

  const template = `
        <button id="new-editBtn">Click to create a new structure question</button>
    `

  newStructureQContainer.innerHTML = template

  document
    .getElementById(`new-editBtn`)
    .addEventListener('click', () => session.handleClickRow('new'))
}

// probably could be combined with renderEditable, but at least if want to chance things later it is easy to do so
function renderReadOnly(session, qData) {
  // returns a question mark if the structure is invalid
  const moleculeSVG = safelyGenerateStructure(qData.molecule)

  const template = `
  <div class="svg-container">${moleculeSVG}</div>
  <div class="options-container">
    <label class="correct-label" for="${qData.structureId}-answer">Answer</label>
    <input class="new-input" id="${qData.structureId}-answer" type="text" value="${
    qData.answer
  }" disabled/>

    <label class="incorrect-label">Incorrect Answers</label>
    <input class="new-input" id="${qData.structureId}-incorrect1" type="text" value="${
    qData.incorrect1
  }" disabled/>
    <input class="new-input" id="${qData.structureId}-incorrect2" type="text" value="${
    qData.incorrect2
  }" disabled/>
    <input class="new-input" id="${qData.structureId}-incorrect3" type="text" value="${
    qData.incorrect3
  }" disabled/>
    ${qData.difficulty === '1' ? '<label class="difficulty-label">Hard</label>' : ''}
  </div>

      <div class="buttons-container">
        <button id="${qData.structureId}-editBtn">Edit</button>
        <button id="${qData.structureId}-submitBtn" disabled>Submit</button>
        <button id="${qData.structureId}-deleteBtn">Delete</button>
      </div>
        `

  document.getElementById(`${qData.structureId}-structureQ-container`).innerHTML = template

  /* EVENTS */
  // set up events for the right-hand-side buttons (submit, cancel)
  document
    .getElementById(`${qData.structureId}-editBtn`)
    .addEventListener('click', () => session.handleClickRow(qData.structureId))

  document
    .getElementById(`${qData.structureId}-deleteBtn`)
    .addEventListener('click', () => handleDeleteItem(session, qData.structureId))
}

/* CONTROLLER */
function initCurrentSession() {
  const blankData = {
    molecule: '',
    answer: '',
    incorrect1: '',
    incorrect2: '',
    incorrect3: '',
    difficulty: '0',
  }

  let currentSessionRef = ''
  let editData = { ...blankData }
  let editRow = 'new'
  let existingData = []

  const structureQList = document.getElementById('existing-structureQ-list')

  // get data from input fields, send to submit function
  // in the case of a new question, editRow = "new"
  function collectAndSubmit() {
    // make a copy of reaction data object so no mutation
    let modifiedData = { ...editData }

    const jsmeApplet = getJsmeApplet()

    // structureId will be undefined when submitting a new question
    // but will have an id for modifying an existing question
    // (this comes from {...editData}, which gets the id when edit is clicked)
    // php will recognize this and either call INSERT INTO or UPDATE depending
    modifiedData.molecule = jsmeApplet.smiles()
    modifiedData.answer = document.getElementById(`${editRow}-answer`).value
    modifiedData.incorrect1 = document.getElementById(`${editRow}-incorrect1`).value
    modifiedData.incorrect2 = document.getElementById(`${editRow}-incorrect2`).value
    modifiedData.incorrect3 = document.getElementById(`${editRow}-incorrect3`).value
    modifiedData.difficulty = document.getElementById(`${editRow}-difficulty-checkbox`).checked
      ? '1'
      : '0'

    editData = modifiedData

    handleSubmit(currentSessionRef)
  }

  function handleClickRow(clickedEditRow) {
    editRow = clickedEditRow
    if (clickedEditRow === 'new') {
      editData = { ...blankData }
    } else {
      editData = existingData.find((data) => data.structureId === clickedEditRow)
    }
    renderAll()
  }

  // function handleDifficultyCheckbox() {
  //   let modifiedData = { ...editData }
  //   modifiedData.difficulty = modifiedData.difficulty === '1' ? '0' : '1'
  //   editData = modifiedData
  // }

  function getState() {
    return { editData, editRow, existingData }
  }

  function renderAll() {
    document.getElementById('response-message').textContent = ''

    // rendering the screen causes the scroll bar to momentarily disappear
    // this means that after the scrollbar comes back, the items are in a different position
    // can take the current position, then set it at the end of the function
    const scrollPosition = document.documentElement.scrollTop

    // reset new section back to grid if -> "block" when rendering as a big button
    document.getElementById('new-structureQ-container').style.display = 'grid'

    hideJsme()
    // render new reaction section
    if (editRow === 'new') {
      renderEditable(currentSessionRef)
    } else {
      renderBigButton(currentSessionRef)
    }

    // render existing reaction list section
    structureQList.innerHTML = ''

    for (let i = 0; i < existingData.length; i++) {
      // create an element in which to render the new data
      const newLiItem = document.createElement('li')
      newLiItem.id = `${existingData[i].structureId}-structureQ-container`
      document.getElementById('existing-structureQ-list').appendChild(newLiItem)

      if (existingData[i].structureId === editRow) {
        renderEditable(currentSessionRef)
      } else {
        renderReadOnly(currentSessionRef, existingData[i])
      }
    }

    document.documentElement.scrollTop = scrollPosition
  }

  function refreshNewInput() {
    editData = { ...blankData }
    editRow = 'new'
  }

  function init(existingQuestionData) {
    existingData = existingQuestionData
    refreshNewInput()
    renderAll()
  }

  function storeSessionRef(currentSession) {
    currentSessionRef = currentSession
  }

  return {
    storeSessionRef,
    init,
    handleClickRow,
    getState,
    collectAndSubmit,
  }
}

async function init() {
  // prevent unauthorized users from entering admin area
  checkAuth(true)

  await initRDKit()

  initializeJsme()

  const existingQData = await getData()

  if (!existingQData) return

  // create a closure for storing the data for the page
  const currentSession = initCurrentSession()

  // need to pass the reference to the closure down the tree, so storing the reference in this step
  currentSession.storeSessionRef(currentSession)

  // populate the closure with existing data, then render the initial screen
  currentSession.init(existingQData)
}

onload = init
