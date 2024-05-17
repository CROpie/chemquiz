import { getJsmeApplet, getJsme, hideJsme, initializeJsme } from '../../../utils/jsme.js'
import { getRDKit, initRDKit, safelyGenerateStructure } from '../../../utils/rdkit.js'
import { convertToChemicalFormula } from '../../../utils/misc.js'
import { ARROW_SVG, PLUS_SVG } from '../../../utils/svgs.js'
import { checkAuth } from '../../../utils/auth.js'

/* VALIDATION */
function validateQuestion(errObj, editData) {
  // the only data a valid reaction requires is a reactant and product
  if (!editData.reactant || !editData.productSmile) {
    errObj.success = false
    errObj.message += 'You must draw at least a reactant and a product.\n'
  }

  return errObj
}

/* FETCH FUNCTIONS */
// fetch list of existing reactions
async function getData() {
  const msgArea = document.getElementById('response-message')

  const response = await fetch('reaction_questions.php')

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

async function handleDeleteItem(session, reactionId) {
  const msgArea = document.getElementById('response-message')

  const response = await fetch(`reaction_questions.php?reactionId=${reactionId}`, {
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

// both new reactions and edited reactions submit through this function
async function handleSubmit(session) {
  const msgArea = document.getElementById('response-message')

  const { editData } = session.getState()
  // if only 1 structure, store in structure1
  if (!editData.reactant && editData.reagent) {
    editData.reactant = editData.reagent
    editData.reagent = ''
  }

  // prevent submission if score isn't valid
  let errObj = { success: true, message: '' }

  errObj = validateQuestion(errObj, editData)

  if (!errObj.success) {
    msgArea.textContent = errObj.message
    return
  }

  const response = await fetch('./reaction_questions.php', {
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

/* RENDER FUNCTIONS */
// will be "new" or the particular reactionId
function renderEditable(session) {
  const { editData, editRow, editCol } = session.getState()

  console.log(editData)

  console.log(editData.difficulty)

  hideJsme()
  getJsmeApplet().reset()

  const productSVG = editData.productSmile ? safelyGenerateStructure(editData.productSmile) : null
  const reactantSVG = editData.reactant ? safelyGenerateStructure(editData.reactant) : null
  const reagentSVG = editData.reagent ? safelyGenerateStructure(editData.reagent) : null

  const template = `

        <button class="mol-input-btn ${editRow}-input" id="${editRow}-reactant-container">${
    reactantSVG ? reactantSVG : 'Reactant'
  }</button>
          <div id="plus-container">${PLUS_SVG}</div>
          <button class="mol-input-btn ${editRow}-input" id="${editRow}-reagent-container">${
    reagentSVG ? reagentSVG : 'Reactant/Reagent'
  }</button>
  <div class="reaction-conditions-container">
  <div>
    <label for="${editRow}-difficulty-checkbox">Difficult Question?</label>
    <input type="checkbox" id="${editRow}-difficulty-checkbox" ${
    editData.difficulty === '1' ? 'checked' : ''
  } />
  </div>
  <div class="spacer">.</div>
    <button class="cond-container ${editRow}-input" id="${editRow}-catalyst-container">${
    editData.catalyst ? convertToChemicalFormula(editData.catalyst) : 'Catalyst'
  }</button>
    <div id="arrow-container">${ARROW_SVG}</div>
    <button class="cond-container ${editRow}-input" id="${editRow}-solvent-container">${
    editData.solvent ? convertToChemicalFormula(editData.solvent) : 'Solvent'
  }</button>
    <button class="cond-container ${editRow}-input" id="${editRow}-temperature-container">${
    editData.temperature ? editData.temperature + ' °C' : 'Reaction Temperature (°C)'
  }</button>
    <button class="cond-container ${editRow}-input" id="${editRow}-time-container">${
    editData.time ? editData.time + ' h' : 'Reaction Time (h)'
  }</button>
</div>
          <button class="mol-input-btn ${editRow}-input" id="${editRow}-productSmile-container">${
    productSVG ? productSVG : 'Product'
  }</button>



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

  document.getElementById(`${editRow}-reactionQ-container`).innerHTML = template

  /* EVENTS */
  // set up events for clicking a column (ie a property that needs to be inputted)
  // only put events on the buttons if they weren't just clicked
  // for the one that was just clicked (editCol), render either a jsme (for molecules) or input field (for conditions)
  let moleculeTypes = ['reactant', 'reagent', 'productSmile']
  moleculeTypes.forEach((moleculeType) => {
    if (moleculeType === editCol) {
      renderEditMolecule(session)
    } else {
      document
        .getElementById(`${editRow}-${moleculeType}-container`)
        .addEventListener('click', () => session.handleClickCol(moleculeType))
    }
  })

  let conditionTypes = ['catalyst', 'solvent', 'temperature', 'time']
  conditionTypes.forEach((conditionType) => {
    if (conditionType === editCol) {
      renderEditCondition(session)
    } else {
      document
        .getElementById(`${editRow}-${conditionType}-container`)
        .addEventListener('click', () => session.handleClickCol(conditionType))
    }
  })

  // difficulty checkbox
  document
    .getElementById(`${editRow}-difficulty-checkbox`)
    .addEventListener('change', () => session.handleDifficultyCheckbox())

  // set up events for the right-hand-side buttons (submit, cancel)
  document
    .getElementById(`${editRow}-submitBtn`)
    .addEventListener('click', () => handleSubmit(session))

  // list only buttons
  if (editRow !== 'new') {
    document
      .getElementById(`${editRow}-cancelBtn`)
      .addEventListener('click', () => session.handleClickRow('new'))
  }
}

// the new input area is rendered with this function when an existing reaction is being edited
function renderBigButton(session) {
  const newReactionQContainer = document.getElementById('new-reactionQ-container')

  const template = `
        <button id="new-editBtn">Click to create a new reaction question</button>
    `

  newReactionQContainer.innerHTML = template

  document
    .getElementById(`new-editBtn`)
    .addEventListener('click', () => session.handleClickRow('new'))
}

// a molecule being edited has a jsme input field as well as 2 buttons: scrap & save
function renderEditMolecule(session) {
  const { editData, editRow, editCol } = session.getState()
  let JSME = getJsme()

  document.getElementById(`${editRow}-${editCol}-container`).innerHTML = ''
  document.getElementById(`${editRow}-${editCol}-container`).appendChild(JSME)

  // will populate the jsme input field with a structure if one currently exists for the reaction, or blank if not
  getJsmeApplet().readGenericMolecularInput(editData[editCol])

  let template = `
            <button type="button" id="scrap-btn">Scrap</button>
            <button type="button" id="save-btn">Save</button>
          `

  const btnContainer = document.createElement('div')
  btnContainer.innerHTML = template
  document.getElementById(`${editRow}-${editCol}-container`).appendChild(btnContainer)

  document.getElementById(`${editRow}-${editCol}-container`).classList.add('editing-molecule')

  document.getElementById(`scrap-btn`).addEventListener('click', () => session.handleClickCol(null))
  document.getElementById(`save-btn`).addEventListener('click', () => session.saveInput())
}

// a condition being edited has a text input as well as 2 buttons: scrap & save
function renderEditCondition(session) {
  const { editData, editRow, editCol } = session.getState()

  let inputTemplate = `
      <div id="input-container>
        <label for="${editCol}-input">${editCol}:</label>
        <input type="text" value="${editData[editCol]}" id="${editRow}-${editCol}-input" />
      </div>
      <div>
        <button type="button" id="scrap-btn">Scrap</button>
        <button type="button" id="save-btn">Save</button>
      </div>
      `

  document.getElementById(`${editRow}-${editCol}-container`).innerHTML = inputTemplate

  document.getElementById(`${editRow}-${editCol}-container`).classList.add('editing-condition')

  document.getElementById(`${editRow}-${editCol}-input`).focus()

  document.getElementById(`scrap-btn`).addEventListener('click', () => session.handleClickCol(null))
  document.getElementById(`save-btn`).addEventListener('click', () => session.saveInput())
}

// print the elements to the page with a button which allows editing
// if the element isn't present in the data, doesn't render a placeholder
function renderReadOnly(session, rData) {
  const productSVG = rData.productSmile ? safelyGenerateStructure(rData.productSmile) : null
  const reactantSVG = rData.reactant ? safelyGenerateStructure(rData.reactant) : null
  const reagentSVG = rData.reagent ? safelyGenerateStructure(rData.reagent) : null

  let template = `
      <div class="reaction-question">
        <div class="svg-container">${reactantSVG ? reactantSVG : ''}</div>
        ${reagentSVG ? `<div id="plus-container">${PLUS_SVG}</div>` : ''}
        <div class="svg-container">${reagentSVG ? reagentSVG : ''}</div>
        <div class="reaction-conditions-container">
        <div class="spacer">.</div>
        <div class="spacer">.</div>
        ${
          rData.catalyst
            ? `<div>${convertToChemicalFormula(rData.catalyst)}</div>`
            : `<div class="spacer">.</div>`
        }
          <div id="arrow-container">${ARROW_SVG}</div>
        ${
          rData.solvent
            ? `<div>${convertToChemicalFormula(rData.solvent)}</div>`
            : `<div class="spacer">.</div>`
        }
        ${
          rData.temperature
            ? `<div>${rData.temperature + ' °C'}</div>`
            : `<div class="spacer">.</div>`
        }
        ${rData.time ? `<div>${rData.time + ' h'}</div>` : `<div class="spacer">.</div>`}
        </div>
        <div class="svg-container">${productSVG ? productSVG : 'Product'}</div>
      </div>
      ${rData.difficulty === '1' ? '<p>Hard</p>' : ''}
      <div class="buttons-container">
        <button id="${rData.reactionId}-editBtn">Edit</button>
        <button id="${rData.reactionId}-submitBtn" disabled>Submit</button>
        <button id="${rData.reactionId}-deleteBtn">Delete</button>
      </div>
  `
  const newLiItem = document.getElementById(`${rData.reactionId}-reactionQ-container`)

  newLiItem.innerHTML = template

  document
    .getElementById(`${rData.reactionId}-editBtn`)
    .addEventListener('click', () => session.handleClickRow(rData.reactionId))

  document
    .getElementById(`${rData.reactionId}-deleteBtn`)
    .addEventListener('click', () => handleDeleteItem(session, rData.reactionId))
}

/* CONTROLLER */
// a closure that keeps the states of:
// editData: either new input data, or data being modified
// editRow: either "new", or the reactionId of the data being modified
// editCol: the current element being modified

// editData can change during saveInput()
// editRow changes when edit is pressed on a row of data (ie a question)
// editCol changes when an item in a reaction is clicked on to edit it

// renderAll()
// editRow === "new":
//  renderEditable() called for the new input section
//  renderReadOnly() called for each existing item
// -------------
// editRow !== "new" and editRow === existingData[i].reactionId
//  renderBigButton() called for the new input section
//  renderReadOnly() called for each existing item except the one being edited
//  renderEditable() called for the one item that is being edited

function initCurrentSession() {
  const blankData = {
    productSmile: '',
    productInchi: '',
    reactant: '',
    reagent: '',
    catalyst: '',
    solvent: '',
    temperature: '',
    time: '',
    difficulty: '0',
  }

  let currentSessionRef = ''
  let editData = { ...blankData }
  let editRow = 'new'
  let editCol = null
  let existingData = []
  const reactionQList = document.getElementById('existing-reactionQ-list')

  function storeSessionRef(currentSession) {
    currentSessionRef = currentSession
  }

  function refreshNewInput() {
    editData = { ...blankData }
    editRow = 'new'
    editCol = null
  }

  function handleClickCol(clickedEditCol) {
    editCol = clickedEditCol
    renderAll()
  }

  function handleClickRow(clickedEditRow) {
    editRow = clickedEditRow
    if (clickedEditRow === 'new') {
      editData = { ...blankData }
    } else {
      editData = existingData.find((data) => data.reactionId === clickedEditRow)
    }
    renderAll()
  }

  function getState() {
    return { editData, editRow, editCol, existingData }
  }

  function handleDifficultyCheckbox() {
    let modifiedData = { ...editData }
    modifiedData.difficulty = modifiedData.difficulty === '1' ? '0' : '1'
    editData = modifiedData
  }

  // different require different methods to get the data
  // this function will extract the correct data using:
  // the current row ("new" or structureId) and
  // the current column (the particular item that is being created/edited)
  function saveInput() {
    // make a copy of reaction data object so no mutation
    let modifiedData = { ...editData }

    let jsmeApplet = getJsmeApplet()
    let RDKit = getRDKit()
    if (editCol === 'reactant') {
      if (!jsmeApplet.smiles()) return

      modifiedData.reactant = jsmeApplet.smiles()
    }

    // allow for reagent to be blank
    if (editCol === 'reagent') {
      if (!jsmeApplet.smiles()) {
        modifiedData.reagent = ''
      } else {
        modifiedData.reagent = jsmeApplet.smiles()
      }
    }

    if (editCol === 'productSmile') {
      if (!jsmeApplet.smiles()) return

      modifiedData.productSmile = jsmeApplet.smiles()
      modifiedData.productInchi = RDKit.get_mol(modifiedData.productSmile).get_inchi()
    }

    if (editCol === 'catalyst') {
      modifiedData.catalyst = document.getElementById(`${editRow}-catalyst-input`).value
    }

    if (editCol === 'solvent') {
      modifiedData.solvent = document.getElementById(`${editRow}-solvent-input`).value
    }

    if (editCol === 'temperature') {
      modifiedData.temperature = document.getElementById(`${editRow}-temperature-input`).value
    }

    if (editCol === 'time') {
      modifiedData.time = document.getElementById(`${editRow}-time-input`).value
    }

    // just replaces the stored reaction data object reference to the newly created one
    editData = modifiedData
    editCol = null
    renderAll()
  }

  function renderAll() {
    // rendering the screen causes the scroll bar to momentarily disappear
    // this means that after the scrollbar comes back, the items are in a different position
    // can take the current position, then set it at the end of the function
    const scrollPosition = document.documentElement.scrollTop

    hideJsme()
    // render new reaction section
    if (editRow === 'new') {
      renderEditable(currentSessionRef)
    } else {
      renderBigButton(currentSessionRef)
    }

    // render existing reaction list section
    reactionQList.innerHTML = ''

    for (let i = 0; i < existingData.length; i++) {
      // create an element in which to render the new data
      const newLiItem = document.createElement('li')
      newLiItem.id = `${existingData[i].reactionId}-reactionQ-container`
      document.getElementById('existing-reactionQ-list').appendChild(newLiItem)

      if (existingData[i].reactionId === editRow) {
        // give the editing list item more height
        newLiItem.classList.add('editing-reaction')
        renderEditable(currentSessionRef)
      } else {
        renderReadOnly(currentSessionRef, existingData[i])
      }
    }

    document.documentElement.scrollTop = scrollPosition
  }

  function init(existingQuestionData) {
    existingData = existingQuestionData
    refreshNewInput()
    renderAll()
  }

  return {
    init,
    storeSessionRef,
    getState,
    handleClickCol,
    handleClickRow,
    handleDifficultyCheckbox,
    saveInput,
  }
}

async function init() {
  // prevent unauthorized users from entering admin area
  checkAuth(true)

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
