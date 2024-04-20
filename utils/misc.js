// Fisher-Yates Sorting Algorithm
// https://www.freecodecamp.org/news/how-to-shuffle-an-array-of-items-using-javascript-or-typescript/
export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

export function convertToChemicalFormula(chemical) {
  const subPattern = /([A-Za-z])([0-9]*)/g
  const supPattern = /([A-Za-z]+)([+\-])$/

  let includeSubscript = chemical.replace(subPattern, (m, p1, p2) => {
    if (p2 === '') return p1
    return p1 + '<sub>' + p2 + '</sub>'
  })

  let includeSuperscript = includeSubscript.replace(supPattern, (m, p1, p2) => {
    return p1 + '<sup>' + p2 + '</sup>'
  })

  return includeSuperscript
}
