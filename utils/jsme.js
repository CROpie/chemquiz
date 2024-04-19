let jsmeApplet

export function initializeJsme() {
  let width = 250
  let height = 250
  let menuScale = 0.8

  jsmeApplet = new JSApplet.JSME('jsme_container', `${width}px`, `${height}px`, {
    options: 'newlook, nofgmenu, nomultipart',
    guicolor: '#FFFFFF',
  })
  jsmeApplet.setMenuScale(menuScale)
  jsmeApplet.setMolecularAreaLineWidth(2)
  jsmeApplet.setAtomMolecularAreaFontSize(8)
  jsmeApplet.setMolecularAreaScale(1)
}

export function hideJsme() {
  const jsme = getJsme()
  document.getElementById('jsme-storage').appendChild(jsme)
}

export function getJsme() {
  return document.getElementById('jsme_container')
}

export function getJsmeApplet() {
  return jsmeApplet
}
