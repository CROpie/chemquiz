import { initializeJsme, getJsme, hideJsme, getJsmeApplet } from '../../../utils/jsme.js'
import { initRDKit, getRDKit } from '../../../utils/rdkit.js'

/**
 *  FLOW
 *
 * Add new in html, never gets re-rendered
 * Starts off active
 *
 * On load, GET existing, render
 * Starts off inactive
 *
 * 1) Fill out new, submit PUT - INSERT
 *
 * 2) Click edit (id)
 *      new becomes inactive
 *      (id) becomes active
 *      fill out (id), submit PUT - UPDATE
 *
 * 3) Click delete (id), submit DELETE
 *
 */

// use id to perform fetch delete on an existing question
// fetch sends back current data, calls re-render with that data
async function handleDeleteItem(id) {
  console.log('deleting: ', id)
  const response = await fetch(`structure_questions.php?structureId=${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    console.log('something went wrong...')
    return
  }

  const json = await response.json()

  console.log(json)

  // call render with new data
  renderQuestions(json.data, true)
}

// use id to perform fetch put on a a new or existing question
// fetch sends back current data, calls re-render with that data
async function putStructureQ(id) {
  console.log(id)
  const jsmeApplet = getJsmeApplet()

  // don't allow submit if no structure
  if (!jsmeApplet.smiles()) return

  // structureid will be undefined for submitting a new question
  // but will have an id for modifying an existing question
  // php will recognize this and either call INSERT INTO or UPDATE depending
  const structureQData = {
    structureId: id,
    molecule: jsmeApplet.smiles(),
    answer: document.getElementById(id ? `q${id}-answer` : 'new-answer').value,
    incorrect1: document.getElementById(id ? `q${id}-incorrect1` : 'new-incorrect1').value,
    incorrect2: document.getElementById(id ? `q${id}-incorrect2` : 'new-incorrect2').value,
    incorrect3: document.getElementById(id ? `q${id}-incorrect3` : 'new-incorrect3').value,
  }

  // don't allow submit if not all input fields have data
  if (
    !structureQData.answer ||
    !structureQData.incorrect1 ||
    !structureQData.incorrect2 ||
    !structureQData.incorrect3
  )
    return

  // don't allow submit if an incorrect answer is the same as the real answer
  if (
    structureQData.answer === structureQData.incorrect1 ||
    structureQData.answer === structureQData.incorrect2 ||
    structureQData.answer === structureQData.incorrect3
  )
    return

  const response = await fetch('structure_questions.php', {
    method: 'PUT',
    body: JSON.stringify(structureQData),
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    console.log('something went wrong...')
    return
  }

  const json = await response.json()

  console.log(json)

  // call render with new data
  renderQuestions(json.data, true)
}

// enables all the input fields for a given question
// disables the new structure area
function handleEditItem({ qData, id, molecule }) {
  // by calling render after pressing edit buttons, everything else will reset which looks nice
  renderQuestions(qData, false)

  const moleculeInputContainer = document.getElementById(`q${id}-molecule`)
  const inputFields = document.querySelectorAll(`.q${id}-input`)

  // remove the SVG
  moleculeInputContainer.innerHTML = ''

  // move JSME to where the SVG was
  moleculeInputContainer.appendChild(getJsme())

  // recreate the molecule and insert it in JSME
  getJsmeApplet().readGenericMolecularInput(molecule)

  disableNewStructure()

  inputFields.forEach((field) => {
    field.disabled = false
  })

  const submitBtn = document.getElementById(`q${id}-submitBtn`)

  submitBtn.disabled = false
  submitBtn.addEventListener('click', () => putStructureQ(id))
}

function disableNewStructure() {
  // enable new structure edit button
  document.getElementById('new-editBtn').disabled = false

  // prevent new structure submitting
  document.getElementById('new-submitBtn').disabled = true

  const inputFields = document.querySelectorAll(`.new-input`)

  inputFields.forEach((field) => {
    field.disabled = true
  })
}

// runs before rendering the items when the new structure fields should be active
function resetNewStructure() {
  document.getElementById('molecule-input-container').appendChild(getJsme())
  document.getElementById('new-editBtn').disabled = true
  document.getElementById('new-submitBtn').disabled = false
  getJsmeApplet().reset()

  const inputFields = document.querySelectorAll(`.new-input`)

  inputFields.forEach((field) => {
    field.disabled = false
  })
}

// display the data from the database to the screen, and set up the event listeners
function renderQuestions(qData, isAddNew) {
  // put the molecule editor in the add new structure area, or hide (for when editing questions)
  if (isAddNew) {
    resetNewStructure()
  } else {
    hideJsme()
  }

  // reset the page
  const structureQList = document.getElementById('existing-structureQ-list')
  structureQList.innerHTML = ''

  const RDKit = getRDKit()

  for (let i = 0; i < qData.length; i++) {
    const moleculeSVG = RDKit.get_mol(qData[i].molecule).get_svg()
    const newLiItem = document.createElement('li')
    let template = `
            <div id="q${qData[i].structureId}-molecule" class="svg-container">${moleculeSVG}</div>
            <div class="options-container">
                <label for="q${qData[i].structureId}-answer">answer</label>
                <input class="q${qData[i].structureId}-input" id="q${qData[i].structureId}-answer" type="text" disabled value="${qData[i].answer}"/>

                <label>Incorrect Answers</label>
                <input class="q${qData[i].structureId}-input" id="q${qData[i].structureId}-incorrect1" type="text" disabled value="${qData[i].incorrect1}"/>
                <input class="q${qData[i].structureId}-input" id="q${qData[i].structureId}-incorrect2" type="text" disabled value="${qData[i].incorrect2}"/>
                <input class="q${qData[i].structureId}-input" id="q${qData[i].structureId}-incorrect3" type="text" disabled value="${qData[i].incorrect3}"/>
            </div>
            <div class="buttons-container">
                <button id="q${qData[i].structureId}-editBtn">Edit</button>
                <button id="q${qData[i].structureId}-submitBtn" disabled>Submit</button>
                <button id="q${qData[i].structureId}-deleteBtn">X</button>
            </div>
    `
    newLiItem.innerHTML = template
    structureQList.appendChild(newLiItem)

    document
      .getElementById(`q${qData[i].structureId}-editBtn`)
      .addEventListener('click', () =>
        handleEditItem({ id: qData[i].structureId, molecule: qData[i].molecule, qData })
      )

    document
      .getElementById(`q${qData[i].structureId}-deleteBtn`)
      .addEventListener('click', () => handleDeleteItem(qData[i].structureId))
  }
}

async function getData() {
  const response = await fetch('structure_questions.php')

  if (!response.ok) {
    console.log('something went wrong...')
    return
  }

  const json = await response.json()

  console.log(json.data)
}

async function init() {
  await initRDKit()

  initializeJsme()

  const structureQuestionsData = await getData()

  if (!structureQuestionsData) return

  renderQuestions(structureQuestionsData, true)

  // set up buttons for new structure (edit, submit)
  document
    .getElementById('new-editBtn')
    .addEventListener('click', () => renderQuestions(structureQuestionsData, true))

  document.getElementById('new-submitBtn').addEventListener('click', () => putStructureQ())
}

onload = init
