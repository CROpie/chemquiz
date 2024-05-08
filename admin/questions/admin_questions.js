import { checkAuth } from '../../utils/auth.js'

function init() {
  // prevent unauthorized users from entering admin area
  checkAuth(true)
}

onload = init
