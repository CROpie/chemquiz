import {
  initRDKit,
  getRDKit,
  safelyGenerateStructure,
  safelyGenerateInchi,
} from '../utils/rdkit.js'
import { convertToChemicalFormula, shuffleArray } from '../utils/misc.js'
import { hideJsme, initializeJsme, getJsme, getJsmeApplet } from '../utils/jsme.js'
import { ARROW_SVG, PLUS_SVG } from '../utils/svgs.js'
import { checkAuth } from '../utils/auth.js'

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
      answerObject.userAnswerSmiles = ''
    } else {
      // get the structure from jsme, then clear the input
      const smile = jsmeApplet.smiles()

      // smile is for rendering the player answer on the results page
      // inchi is for checking player's answer with the one stored in the database
      answerObject.userAnswerSmiles = smile
      answerObject.userAnswer = safelyGenerateInchi(smile)

      jsmeApplet.reset()
    }
    hideJsme()
  }

  console.log(currentGame.getPlayerAnswers())

  currentGame.answerQuestion(answerObject)
  determineQuestion(currentGame)
}

function renderReactionQuestion(currentGame, rData) {
  // const RDKit = getRDKit()

  // const reactantSVG = rData.reactant ? RDKit.get_mol(rData.reactant).get_svg() : null
  // const reagentSVG = rData.reagent ? RDKit.get_mol(rData.reagent).get_svg() : null

  const reactantSVG = rData.reactant ? safelyGenerateStructure(rData.reactant) : null
  const reagentSVG = rData.reagent ? safelyGenerateStructure(rData.reagent) : null

  let template = `
      <section id="reaction-question-container">
        <div id="reaction-container">
          <div class="svg-container">${reactantSVG ? reactantSVG : ''}</div>

          ${reagentSVG ? `<div>${PLUS_SVG}</div>` : ''}

          <div class="svg-container">${reagentSVG ? reagentSVG : ''}</div>

          <div class="reaction-conditions-container">

            <div class="spacer">.</div>
            <div class="spacer">.</div>

            <div>${rData.catalyst ? convertToChemicalFormula(rData.catalyst) : ''}</div>
            <div>${ARROW_SVG}</div>
            <div>${rData.solvent ? convertToChemicalFormula(rData.solvent) : ''}</div>
            <div>${rData.temperature ? rData.temperature + ' °C' : ''}</div>
            <div>${rData.time ? rData.time + ' h' : ''}</div>

          </div>

          <div id="product-container"></div>
        </div>
        <div>
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
  // let RDKit = getRDKit()
  // const questionSVG = RDKit.get_mol(question.molecule).get_svg()

  const questionSVG = safelyGenerateStructure(question.molecule)

  let choices = [question.answer, question.incorrect1, question.incorrect2, question.incorrect3]
  choices = shuffleArray(choices)
  let template = `
        <section id="structure-question-container">
          <div id="structure-container">
            <h2>Select the correct name for this structure:</h2>
            <div id="structure-svg-container">${questionSVG}</div>
          </div>
          <div id="structure-answers-container">
            <button id="choice0">${choices[0]}</button>
            <button id="choice1">${choices[1]}</button>
            <button id="choice2">${choices[2]}</button>
            <button id="choice3">${choices[3]}</button>
          </div>
        </section>
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

  sessionStorage.setItem('playerAnswers', JSON.stringify(answers))

  const MAIN = document.getElementById('main')

  let template = `<h1>Sending answers to the database...</h1>`

  MAIN.innerHTML = template

  // answers: [{questionType: ("structure" | "reaction"), questionId: number, userAnswer: string, userAnswerSmiles: string? }]
  const response = await fetch(`../results/results.php?userId=${userId}`, {
    method: 'POST',
    body: JSON.stringify(answers),
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    console.log('something went wrong...')
    return
  }

  /* json = 
    { success: boolean, 
      message: string, 
      score: number, 
      results: boolean[], 
      leaderBoard: [{
        userId: "number",
        username: string,
        attemptDate: string,
        topScore: "number"
      }, ...],
      attemptCount: "string",
      highestScores: [{
        score: "number",
        attemptDate: string
      }, ...]  
  */
  const json = await response.json()

  // unexpected database failure..
  if (!json.success) {
    console.log('something went wrong...')
    return
  }

  // store the answers in sessionStorage
  sessionStorage.setItem('results', JSON.stringify(json.results))
  sessionStorage.setItem('leaderBoard', JSON.stringify(json.leaderBoard))
  sessionStorage.setItem('attemptCount', json.attemptCount)
  sessionStorage.setItem('highestScores', JSON.stringify(json.highestScores))
  sessionStorage.setItem('score', json.score)

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

  // store the shuffled questions in sessionStorage, to be able to retrieve in results.jp and render them in answered order
  sessionStorage.setItem('questions', JSON.stringify(shuffledQuestions))

  const currentGame = storeInfo(shuffledQuestions)

  determineQuestion(currentGame)
}

async function init() {
  // prevent unauthorized users from entering admin area
  checkAuth()

  await initRDKit()
  initializeJsme()
  prepareQuestions()
}

onload = init
