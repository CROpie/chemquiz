import { QUESTION_MARK } from './svgs.js'

let RDKit

export async function initRDKit() {
  RDKit = await initRDKitModule()
}

export function getRDKit() {
  return RDKit
}

export function safelyGenerateStructure(smiles) {
  let SVG = ''
  try {
    SVG = getRDKit().get_mol(smiles).get_svg()
  } catch (error) {
    // RDKit can't render the mol structure therefore can't render the chemical because it is a faulty structure
    SVG = QUESTION_MARK
  }

  return SVG
}

export function safelyGenerateInchi(smiles) {
  let userAnswer = ''
  try {
    userAnswer = getRDKit().get_mol(smiles).get_inchi()
  } catch (error) {
    // RDKit can't render the get the mol structure therefore can't get the inchi because it is faulty structure
    userAnswer = '*INVALID STRUCTURE INPUTTED*'
  }
  return userAnswer
}
