let RDKit

export async function initRDKit() {
  RDKit = await initRDKitModule()
}

export function getRDKit() {
  return RDKit
}

// Fisher-Yates Sorting Algorithm
// https://www.freecodecamp.org/news/how-to-shuffle-an-array-of-items-using-javascript-or-typescript/
export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}
