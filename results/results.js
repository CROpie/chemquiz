import { initRDKit, getRDKit, safelyGenerateStructure } from '../utils/rdkit.js'
import { QUESTION_MARK, ARROW_SVG, PLUS_SVG } from '../utils/svgs.js'
import { convertToChemicalFormula } from '../utils/misc.js'
import { checkAuth } from '../utils/auth.js'

function renderTotalScore(totalScore, numQuestions) {
  const resultsList = document.getElementById('results-list')
  const newLiItem = document.createElement('li')
  resultsList.appendChild(newLiItem)

  let avgPercentage = (totalScore / numQuestions) * 100

  let displayMessage = ''

  if (avgPercentage < 50)
    displayMessage = 'Great , You have failed , expect the same if u do not work hard !!! '
  else if (avgPercentage >= 50 && avgPercentage <= 59)
    displayMessage = 'You have barely  passed dude , be careful, You may fail anytime !!! '
  else if (avgPercentage >= 60 && avgPercentage <= 69)
    displayMessage = 'You have managed a credit score mate , pretty decent !!! '
  else if (avgPercentage >= 70 && avgPercentage <= 79)
    displayMessage = 'hmm , entering distinction area , are we ?? . good good  !!! '
  else if (avgPercentage >= 80 && avgPercentage <= 100)
    displayMessage = 'wow , wow . congrats on the high distinction !!! '

  let template = `
    <p>
      Your score was: 
      <span class="${totalScore / numQuestions < 0.5 ? 'red' : 'green'}">${totalScore * 10}</span>
     / ${numQuestions * 10}
     </p>
     <p>${displayMessage}</P>
     <a href="../welcome/welcome.html"><button type="button">Return</button></a>
  `

  newLiItem.innerHTML = template
}

function renderReactionResult(question, playerAnswer, result, questionNo) {
  const RDKit = getRDKit()

  // const reactantSVG = RDKit.get_mol(question.reactant).get_svg()
  // const reagentSVG = question.reagent ? RDKit.get_mol(question.reagent).get_svg() : null

  // const answerSVG = RDKit.get_mol(question.productSmile).get_svg()
  // const playerAnswerSVG = playerAnswer.userAnswerSmiles
  //   ? RDKit.get_mol(playerAnswer.userAnswerSmiles).get_svg()
  //   : null

  const reactantSVG = safelyGenerateStructure(question.reactant)
  const reagentSVG = question.reagent ? safelyGenerateStructure(question.reagent) : null

  const answerSVG = safelyGenerateStructure(question.productSmile)
  const playerAnswerSVG = playerAnswer.userAnswerSmiles
    ? safelyGenerateStructure(playerAnswer.userAnswerSmiles)
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

function renderPlayerResponses(questions, playerAnswers, resultsArray, score) {
  const resultsList = document.getElementById('results-list')

  // i corresponds to the question number
  for (let i = 0; i < questions.length; i++) {
    const newLiItem = document.createElement('li')
    resultsList.appendChild(newLiItem)

    let liContent = ''

    if (questions[i].structureId) {
      liContent = renderStructureResult(questions[i], playerAnswers[i], resultsArray[i], i)
    }

    if (questions[i].reactionId) {
      liContent = renderReactionResult(questions[i], playerAnswers[i], resultsArray[i], i)
    }

    newLiItem.innerHTML = liContent
  }

  renderTotalScore(score, questions.length)
}

async function init() {
  // prevent unauthorized users from entering admin area
  checkAuth()

  await initRDKit()

  const questions = JSON.parse(sessionStorage.getItem('questions'))
  const playerAnswers = JSON.parse(sessionStorage.getItem('playerAnswers'))
  const resultsArray = JSON.parse(sessionStorage.getItem('results'))
  const score = sessionStorage.getItem('score')

  console.log(questions, playerAnswers, resultsArray)

  renderPlayerResponses(questions, playerAnswers, resultsArray, score)
}

onload = init
