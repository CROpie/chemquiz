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

  if (username && !username.match(/^[a-zA-Z]+$/)) {
    result = false
    errObj.username = 'A username may only include letters.'
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
  document.getElementById('loginForm').addEventListener('submit', handleSubmit)
  document.getElementById('flexCheckIndeterminate').addEventListener('change', show)
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

  const json = await response.json()

  console.log(json)

  // handle failure to log in
  if (!json.success) {
    document.getElementById('invalid-submit').textContent = json.message
    return
  }

  // if admin, go to admin page
  if (json.isAdmin === '1') {
    window.location.href = './admin/admin.html'
    // return isn't necessary but perhaps good to have just in case
    return
  }

  // is student so go to student page
  // writing separately here, but ideally would be sent the student data from php already

  const response2 = await fetch('./welcome/welcome.php', {
    method: 'POST',
    body: formData,
  })

  if (!response2.ok) {
    console.log('something went wrong')
    return
  }

  const json2 = await response2.json()

  console.log(json2)

  sessionStorage.setItem('userInfo', JSON.stringify({ username, userId: json.userId }))
  sessionStorage.setItem('userScores', JSON.stringify(json2.data))
  window.location.href = './welcome/welcome.html'
}

onload = init
