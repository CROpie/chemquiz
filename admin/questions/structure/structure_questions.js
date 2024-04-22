import { getRDKit, initRDKit } from '../../../utils/rdkit.js'
import { initializeJsme, getJsme, getJsmeApplet, hideJsme } from '../../../utils/jsme.js'

/* FETCH FUNCTIONS */
async function getData() {
  const response = await fetch('structure_questions.php')

  if (!response.ok) {
    console.log('something went wrong...')
    return
  }

  const json = await response.json()

  return json.data
}

async function handleSubmit(session) {
  const { editData } = session.getState()

  const response = await fetch('./structure_questions.php', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(editData),
  })

  if (!response.ok) {
    console.log('something went wrong...')
    return
  }

  const json = await response.json()

  session.init(json.data)
}

async function handleDeleteItem(session, structureId) {
  const response = await fetch(`structure_questions.php?structureId=${structureId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    console.log('something went wrong...')
    return
  }

  const json = await response.json()

  // call render with updated data
  session.init(json.data)
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
    <label for="${editRow}-answer">answer</label>
    <input class="new-input" id="${editRow}-answer" type="text" value="${editData.answer}"/>

    <label>Incorrect Answers</label>
    <input class="new-input" id="${editRow}-incorrect1" type="text" value="${editData.incorrect1}"/>
    <input class="new-input" id="${editRow}-incorrect2" type="text" value="${editData.incorrect2}"/>
    <input class="new-input" id="${editRow}-incorrect3" type="text" value="${editData.incorrect3}"/>
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
  const moleculeSVG = getRDKit().get_mol(qData.molecule).get_svg()

  const template = `
  <div class="svg-container">${moleculeSVG}</div>
  <div class="options-container">
    <label for="${qData.structureId}-answer">Answer</label>
    <input class="new-input" id="${qData.structureId}-answer" type="text" value="${qData.answer}" disabled/>

    <label>Incorrect Answers</label>
    <input class="new-input" id="${qData.structureId}-incorrect1" type="text" value="${qData.incorrect1}" disabled/>
    <input class="new-input" id="${qData.structureId}-incorrect2" type="text" value="${qData.incorrect2}" disabled/>
    <input class="new-input" id="${qData.structureId}-incorrect3" type="text" value="${qData.incorrect3}" disabled/>
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
    difficulty: 1,
  }

  let currentSessionRef = ''
  let editData = { ...blankData }
  let editRow = 'new'
  let existingData = []

  const structureQList = document.getElementById('existing-structureQ-list')

  // get data from input fields, validate it, send to submit function
  function collectAndSubmit() {
    // make a copy of reaction data object so no mutation
    let modifiedData = { ...editData }

    const jsmeApplet = getJsmeApplet()

    // don't allow submit if no structure
    if (!jsmeApplet.smiles()) return

    // structureId will be undefined when submitting a new question
    // but will have an id for modifying an existing question
    // (this comes from {...editData}, which gets the id when edit is clicked)
    // php will recognize this and either call INSERT INTO or UPDATE depending
    modifiedData.molecule = jsmeApplet.smiles()
    modifiedData.answer = document.getElementById(`${editRow}-answer`).value
    modifiedData.incorrect1 = document.getElementById(`${editRow}-incorrect1`).value
    modifiedData.incorrect2 = document.getElementById(`${editRow}-incorrect2`).value
    modifiedData.incorrect3 = document.getElementById(`${editRow}-incorrect3`).value

    // don't allow submit if not all input fields have data
    if (
      !modifiedData.answer ||
      !modifiedData.incorrect1 ||
      !modifiedData.incorrect2 ||
      !modifiedData.incorrect3
    ) {
      alert('need to fill in all fields')
      return
    }

    // don't allow submit if an incorrect answer is the same as the real answer
    if (
      modifiedData.answer === modifiedData.incorrect1 ||
      modifiedData.answer === modifiedData.incorrect2 ||
      modifiedData.answer === modifiedData.incorrect3
    ) {
      alert("can't have an incorrect response being the same as the correct one")
      return
    }

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

  function getState() {
    return { editData, editRow, existingData }
  }

  function renderAll() {
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

  return { storeSessionRef, init, handleClickRow, getState, collectAndSubmit }
}

async function init() {
  await initRDKit()

  initializeJsme()

  const existingQData = await getData()

  // create a closure for storing the data for the page
  const currentSession = initCurrentSession()

  // need to pass the reference to the closure down the tree, so storing the reference in this step
  currentSession.storeSessionRef(currentSession)

  // populate the closure with existing data, then render the initial screen
  currentSession.init(existingQData)
}

onload = init
