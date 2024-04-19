import { initRDKit, getRDKit, shuffleArray } from './utils.js'

function handleAnswerQuestion(type, currentGame, questionId, answer) {
  let answerObject = {
    answerType: type,
    questionId,
  }

  if (type === 'structure') {
    answerObject.userAnswer = answer
    currentGame.answerQuestion(answerObject)
  }

  // if (type === 'reaction') {
  //   const jsmeApplet = getApplet()
  //   const RDKit = getRDKit()
  //   const smile = jsmeApplet.smiles()
  //   answerObject.answer = RDKit.get_mol(smile).get_inchi()
  //   hideJsme()
  // } else if (type === 'structure') {
  //   answerObject.answer = answer
  // }

  // console.log(currentGame.getPlayerAnswers())

  determineQuestion(currentGame)
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

// figure out what time of question to render, or end the game
function determineQuestion(currentGame) {
  const question = currentGame.getQuestion()
  console.log('current question: ', question)
  if (!question) {
    // quiz is over, send answers to php
    handleFinishQuiz(currentGame.getPlayerAnswers())
    return
  }

  // if (question.reactionId) {
  //   renderReactionQuestion(currentGame, question)
  //   return
  // }

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
  prepareQuestions()
}

onload = init
