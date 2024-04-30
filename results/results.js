import { initRDKit, getRDKit } from '../utils/rdkit.js'
import { QUESTION_MARK, ARROW_SVG, PLUS_SVG } from '../utils/svgs.js'
import { convertToChemicalFormula } from '../utils/misc.js'

function renderTotalScore(totalScore, numQuestions) {
  const resultsList = document.getElementById('results-list')
  const newLiItem = document.createElement('li')
  resultsList.appendChild(newLiItem)

  let template = `
    <p>
      Your score was: 
      <span class="${totalScore / numQuestions < 0.5 ? 'red' : 'green'}">${totalScore * 10}</span>
     / ${numQuestions * 10}
     </p>
  `

  newLiItem.innerHTML = template
}

function renderReactionResult(question, playerAnswer, result, questionNo) {
  const RDKit = getRDKit()

  const reactantSVG = RDKit.get_mol(question.reactant).get_svg()
  const reagentSVG = question.reagent ? RDKit.get_mol(question.reagent).get_svg() : null

  const answerSVG = RDKit.get_mol(question.productSmile).get_svg()
  const playerAnswerSVG = playerAnswer.userAnswerSmiles
    ? RDKit.get_mol(playerAnswer.userAnswerSmiles).get_svg()
    : null

  let template = `
    <div class="reaction-question question-container">
      <h2>${questionNo + 1}:</h2>

      <div class="svg-container">${reactantSVG}</div>

        ${reagentSVG ? `<div>${PLUS_SVG}</div>` : ''}
        
      <div class="svg-container">${reagentSVG ? reagentSVG : ''}</div>

      <div class="reaction-conditions-container">

        <div class="spacer">.</div>
        <div class="spacer">.</div>

          <div>${question.catalyst ? convertToChemicalFormula(question.catalyst) : ''}</div>
          <div>${ARROW_SVG}</div>
          <div>${question.solvent ? convertToChemicalFormula(question.solvent) : ''}</div>
          <div>${question.temperature ? question.temperature + ' °C' : ''}</div>
          <div>${question.time ? question.time + ' h' : ''}</div>
      </div>

      <div class="mol-input-btn">${QUESTION_MARK}</div>

    </div>

    <div class="answers-container">
      <div class="reaction-compare-response">
        <h3 class="reaction-response">Answer: ${answerSVG}</h3>
        <h3 class="reaction-response">Your answer: ${
          playerAnswerSVG ? playerAnswerSVG : '&lt;No Attempt&gt;'
        }</h3>
      </div>
        <p class="result-score ${result ? 'green' : 'red'}">${result ? '✔ 10' : '✘ 0'}</p>
    </div>
      `

  return template
}

function renderStructureResult(question, playerAnswer, result, questionNo) {
  const moleculeSVG = getRDKit().get_mol(question.molecule).get_svg()

  const template = `
    <div class="structure-question question-container">
    <h2>${questionNo + 1}:</h2>
    <h2>What is this structure?</h2>
      <div class="svg-container">${moleculeSVG}</div>
    </div>

    <div class="answers-container">
      <div>
        <h3>Answer:
          <span>${question.answer}</span>
        </h3>
        <h3>Your answer:
          <span class="${result ? 'dgreen' : 'red'}">${playerAnswer.userAnswer}</span>
        </h3>
      </div>
      <p class="result-score ${result ? 'green' : 'red'}">${result ? '✔ 10' : '✘ 0'}</p>
    </div>
  `

  return template
}

function renderPlayerResponses(questions, playerAnswers, resultsObject) {
  const resultsList = document.getElementById('results-list')

  // i corresponds to the question number
  for (let i = 0; i < questions.length; i++) {
    const newLiItem = document.createElement('li')
    resultsList.appendChild(newLiItem)

    let liContent = ''

    if (questions[i].structureId) {
      liContent = renderStructureResult(questions[i], playerAnswers[i], resultsObject.results[i], i)
    }

    if (questions[i].reactionId) {
      liContent = renderReactionResult(questions[i], playerAnswers[i], resultsObject.results[i], i)
    }

    newLiItem.innerHTML = liContent
  }

  renderTotalScore(resultsObject.score, questions.length)
}

async function init() {
  await initRDKit()

  const questions = JSON.parse(sessionStorage.getItem('questions'))
  const playerAnswers = JSON.parse(sessionStorage.getItem('playerAnswers'))
  const resultsObject = JSON.parse(sessionStorage.getItem('results'))

  renderPlayerResponses(questions, playerAnswers, resultsObject)
}

onload = init
