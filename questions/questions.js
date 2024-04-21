import { initRDKit, getRDKit } from '../utils/rdkit.js'
import { convertToChemicalFormula, shuffleArray } from '../utils/misc.js'
import { hideJsme, initializeJsme, getJsme, getJsmeApplet } from '../utils/jsme.js'
import { ARROW_SVG, PLUS_SVG } from '../utils/svgs.js'

function handleAnswerQuestion(type, currentGame, questionId, answer) {
  let answerObject = {
    answerType: type,
    questionId,
  }

  if (type === 'structure') {
    answerObject.userAnswer = answer
  }

  if (type === 'reaction') {
    const jsmeApplet = getJsmeApplet()
    // no attempt to answer the question
    if (!jsmeApplet.smiles()) {
      answerObject.userAnswer = ''
    } else {
      // get the structure from jsme, then clear the input
      const smile = jsmeApplet.smiles()
      const RDKit = getRDKit()

      answerObject.userAnswer = RDKit.get_mol(smile).get_inchi()

      jsmeApplet.reset()
    }
    hideJsme()
  }

  console.log(currentGame.getPlayerAnswers())

  currentGame.answerQuestion(answerObject)
  determineQuestion(currentGame)
}

function renderReactionQuestion(currentGame, rData) {
  const RDKit = getRDKit()

  const reactantSVG = rData.reactant ? RDKit.get_mol(rData.reactant).get_svg() : null
  const reagentSVG = rData.reagent ? RDKit.get_mol(rData.reagent).get_svg() : null

  let template = `
      <section id=reactionQ-container>
      <div class="mol-input-btn" id="reactant-container">${reactantSVG ? reactantSVG : ''}</div>
        ${reagentSVG ? `<div id="plus-container">${PLUS_SVG}</div>` : ''}
      <div class="mol-input-btn" id="reagent-container">${reagentSVG ? reagentSVG : ''}</div>
      <div class="reaction-conditions-container">
        <div class="spacer">.</div>
        <div class="spacer">.</div>
          <div class="cond-container" id="catalyst-container">${
            rData.catalyst ? convertToChemicalFormula(rData.catalyst) : ''
          }</div>
          <div id="arrow-container">${ARROW_SVG}</div>
          <div class="cond-container" id="solvent-container">${
            rData.solvent ? convertToChemicalFormula(rData.solvent) : ''
          }</div>
          <div class="cond-container" id="reaction-temp-container">${
            rData.temperature ? rData.temperature + ' °C' : ''
          }</div>
          <div class="cond-container" id="reaction-time-container">${
            rData.time ? rData.time + ' h' : ''
          }</div>
      </div>
      <div class="mol-input-btn" id="product-container"></div>
      <div class="buttons-container">
        <button id="submitBtn">Submit</button>
      </div>
      </section>
  `

  const MAIN = document.getElementById('main')
  MAIN.innerHTML = template

  document.getElementById(`product-container`).appendChild(getJsme())

  document
    .getElementById('submitBtn')
    .addEventListener('click', () =>
      handleAnswerQuestion('reaction', currentGame, rData.reactionId)
    )
}

function renderStructureQuestion(currentGame, question) {
  let RDKit = getRDKit()
  const questionSVG = RDKit.get_mol(question.molecule).get_svg()
  let choices = [question.answer, question.incorrect1, question.incorrect2, question.incorrect3]
  choices = shuffleArray(choices)
  let template = `
          <h2>Select the correct name for this structure:</h2>
          <div>${questionSVG}</div>
          <button id="choice0">${choices[0]}</button>
          <button id="choice1">${choices[1]}</button>
          <button id="choice2">${choices[2]}</button>
          <button id="choice3">${choices[3]}</button>
      `

  const MAIN = document.getElementById('main')
  MAIN.innerHTML = template

  for (let i = 0; i < choices.length; i++) {
    document
      .getElementById(`choice${i}`)
      .addEventListener('click', () =>
        handleAnswerQuestion('structure', currentGame, question.structureId, choices[i])
      )
  }
}

async function handleFinishQuiz(answers) {
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo'))
  const userId = userInfo.userId
  console.log(answers)

  const MAIN = document.getElementById('main')

  let template = `<h1>Sending answers to the database...</h1>`

  MAIN.innerHTML = template

  const response = await fetch(`../results/results.php?userId=${userId}`, {
    method: 'POST',
    body: JSON.stringify(answers),
    'Content-Type': 'application/json',
  })

  if (!response.ok) {
    console.log('something went wrong...')
    return
  }

  const json = await response.json()

  console.log(json)

  // store the answers in sessionStorage
  sessionStorage.setItem('playerScore', JSON.stringify(json))

  // redirect to results page
  window.location.href = '../results/results.html'
}

// figure out what type of question to render, or end the game
function determineQuestion(currentGame) {
  const question = currentGame.getQuestion()
  console.log('current question: ', question)
  if (!question) {
    // quiz is over, send answers to php
    handleFinishQuiz(currentGame.getPlayerAnswers())
    return
  }

  if (question.reactionId) {
    renderReactionQuestion(currentGame, question)
    return
  }

  if (question.structureId) {
    renderStructureQuestion(currentGame, question)
    return
  }
}

// a closure to store all the game information
function storeInfo(questions) {
  let storedQuestions = questions
  let storedAnswers = []
  let storedQuestionNumber = 0

  function getQuestion() {
    return storedQuestions[storedQuestionNumber]
  }

  function answerQuestion(playerResponse) {
    storedAnswers[storedQuestionNumber] = playerResponse
    storedQuestionNumber++
  }

  function getPlayerAnswers() {
    return storedAnswers
  }

  return { getQuestion, answerQuestion, getPlayerAnswers }
}

function prepareQuestions() {
  const questions = JSON.parse(sessionStorage.getItem('questions'))

  const shuffledQuestions = shuffleArray(questions)

  const currentGame = storeInfo(shuffledQuestions)

  determineQuestion(currentGame)
}

async function init() {
  await initRDKit()
  initializeJsme()
  prepareQuestions()
}

onload = init
