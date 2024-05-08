function resetErrorFields() {
  document.getElementById(`invalid-username`).textContent = ''
  document.getElementById(`invalid-password`).textContent = ''
  document.getElementById('invalid-submit').textContent = ''
}

function checkValidity() {
  let result = true

  const username = document.getElementById('username').value
  const password = document.getElementById('password').value

  let errObj = { username: '', password: '' }

  if (!username) {
    result = false
    errObj.username = 'Please enter a username.'
  }

  if (!password) {
    result = false
    errObj.password = 'Please enter a password.'
  }

  if (username && !username.match(/^[a-zA-Z0-9]+@(student\.)?instatute\.edu\.au$/)) {
    result = false
    errObj.username = 'Invalid username.'
  }

  if (password && !password.match(/^.{8,}$/)) {
    result = false
    errObj.password = 'A password must have at least 8 characters.'
  }

  // proceed if no errors
  if (result) return true

  // otherwise, print errors to screen
  for (const [key, value] of Object.entries(errObj)) {
    // ignore the keys which don't have values (ie those which didn't have errors)
    if (!value) continue

    const errorMsgLocation = document.getElementById(`invalid-${key}`)
    errorMsgLocation.textContent = `Error: ${value}`
  }
}

function show() {
  var x = document.getElementById('password')

  if (x.type === 'password') {
    x.type = 'text'
  } else {
    x.type = 'password'
  }
}

function init() {
  sessionStorage.clear()
  document.getElementById('loginForm').addEventListener('submit', handleSubmit)
  document.getElementById('flexCheckIndeterminate').addEventListener('change', show)
  document.getElementById('flexCheckIndeterminate').checked = false
}

async function handleSubmit(event) {
  event.preventDefault()
  resetErrorFields()

  // only post the data if the user input is valid
  if (!checkValidity()) return

  console.log('passed client-side validation')

  const formData = new FormData(event.target)

  // index.html is in the root folder, so url has to path from there (?)
  const response = await fetch('./login/login.php', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    console.log('something went wrong')
    return
  }

  // json = { success: boolean, message: string, userData: {userId: "number", username: string, isAdmin: "0" | "1"} }
  const json = await response.json()

  // handle failure to log in
  if (!json.success) {
    document.getElementById('invalid-submit').textContent = json.message
    return
  }

  sessionStorage.setItem('userInfo', JSON.stringify(json.userData))

  // if admin, go to admin page
  if (json.userData.isAdmin === '1') {
    window.location.href = './admin/admin.html'
    // return isn't necessary but perhaps good to have just in case
    return
  }

  // is student so go to student page
  // writing separately here, but ideally would be sent the student data from php already

  const response2 = await fetch(`./welcome/welcome.php?userId=${json.userData.userId}`)

  if (!response2.ok) {
    console.log('something went wrong')
    return
  }

  /* json2 =
    { success: boolean, 
      message: string, 
      leaderBoard: [{
        userId: "number",
        username: string,
        attemptDate: string,
        topScore: "number"
      }, ...],
      attemptCount: "number",
      highestScores: [{
        score: "number",
        attemptDate: string)
      }, ...]  
  */
  const json2 = await response2.json()

  // handle failure to get data from database
  if (!json2.success) {
    document.getElementById('invalid-submit').textContent = json2.message
    return
  }

  sessionStorage.setItem('leaderBoard', JSON.stringify(json2.leaderBoard))
  sessionStorage.setItem('attemptCount', json2.attemptCount)
  sessionStorage.setItem('highestScores', JSON.stringify(json2.highestScores))

  window.location.href = './welcome/welcome.html'
}

onload = init
