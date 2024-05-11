import { checkAuth } from '../../utils/auth.js'

function validatePassword(errObj, password) {
  if (username && !password.match(/^.{8,}$/)) {
    errObj.success = false
    errObj.message += 'A password must have at least 8 characters.\n'
  }

  return errObj
}

function validateUsername(errObj, username) {
  if (!username) {
    errObj.success = false
    errObj.message += 'Please enter a username.\n'
  }

  if (username && !username.match(/^[a-zA-Z0-9]+$/)) {
    errObj.success = false
    errObj.message += 'A username may only include letters and numbers.\n'
  }

  return errObj
}

function validateDelAdmin(errObj, username) {
  if (username === 'admin') {
    errObj.success = false
    errObj.message += 'You are not allowed to delete this user.\n'
  }
  return errObj
}

async function getData() {
  const msgArea = document.getElementById('response-message')

  const response = await fetch('./admin_users.php')

  if (!response.ok) {
    msgArea.textContent = 'Error fetching data.'
    return false
  }

  // json = { success: boolean, message: string, data: [{userId: number, username: string, dateJoined: string, isAdmin: enum("0" | "1")]}
  const json = await response.json()

  if (!json.success) {
    msgArea.textContent = json.message
    return false
  }

  return json.data
}

async function handleDelete(userData) {
  const msgArea = document.getElementById('response-message')

  // prevent submission if name is "admin"
  // will give multiple messages if multiple problems are detected
  let errObj = { success: true, message: '' }

  errObj = validateDelAdmin(errObj, userData.username)

  if (!errObj.success) {
    msgArea.textContent = errObj.message
    return
  }

  const response = await fetch(`./admin_users.php?userId=${userData.userId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    msgArea.textContent = 'Error fetching data.'
    return
  }

  // if successful, this json will contain the updated users information so it can be rendered immediately
  const json = await response.json()

  if (!json.success) {
    // show error message
    msgArea.textContent = json.message
    return
  }

  renderUsers(json.data)

  // show success message
  msgArea.textContent = json.message
}

function resetFields() {
  // reset new password section if it was open
  document.getElementById('replace-password-container').innerHTML = ''

  // reset any error or success messages
  document.getElementById('response-message').textContent = ''

  // reset input fields (username, password)
  document.getElementById('username').value = ''
  document.getElementById('password').value = ''
  document.getElementById('admin').checked = false
}

function renderUsers(usersData) {
  resetFields()

  const TBODY = document.getElementById('tbody')

  // if TBODY has any data, clear it
  // this is important after making a change, so you don't get row duplication
  TBODY.innerHTML = ''

  for (let i = 0; i < usersData.length; i++) {
    const trow = document.createElement('tr')

    const rowTemplate = `
      <td id="userId-${i}">${usersData[i].userId}</td>
      <td id="username-${i}">${usersData[i].username}</td>
      <td id="dateJoined-${i}">${usersData[i].dateJoined}</td>
      <td id="isAdmin-${i}">${usersData[i].isAdmin === '1' ? 'yes' : 'no'}</td>
      <td id="editTd-${i}"><button id="editBtn-${i}">E</button></td>
      <td id="passTd-${i}"><button id="passBtn-${i}">P</button></td>
      <td><button id="delBtn-${i}">X</button></td>
    `

    trow.innerHTML = rowTemplate
    TBODY.appendChild(trow)

    // set up del button event
    document
      .getElementById(`delBtn-${i}`)
      .addEventListener('click', () => handleDelete(usersData[i]))

    document
      .getElementById(`passBtn-${i}`)
      .addEventListener('click', () => handleNewPassword(usersData, i))

    document
      .getElementById(`editBtn-${i}`)
      .addEventListener('click', () => handleEditUser(usersData, i))
  }
}

function handleNewPassword(usersData, i) {
  renderUsers(usersData)

  const container = document.getElementById('replace-password-container')

  const template = `
    <h2>Replace Password</h2>
    <label for="input-pass-${i}">New password for ${usersData[i].username}:</label>
    <input id="input-pass-${i}" type="text" />
    <button type="button" id="cancelBtn">Cancel</button>
    <button type="button" id="saveBtn">Save</button>
  `

  container.innerHTML = template

  document.getElementById('cancelBtn').addEventListener('click', () => renderUsers(usersData))
  document
    .getElementById('saveBtn')
    .addEventListener('click', () => handleSaveNewPassword(usersData, i))

  document.getElementById(`input-pass-${i}`).focus()
}

async function handleSaveNewPassword(usersData, i) {
  const msgArea = document.getElementById('response-message')

  const newPassword = document.getElementById(`input-pass-${i}`).value

  // prevent submission if password isn't valid
  // will give multiple messages if multiple problems are detected
  let errObj = { success: true, message: '' }

  errObj = validatePassword(errObj, newPassword)

  if (!errObj.success) {
    msgArea.textContent = errObj.message
    return
  }

  const updatedUsersData = { ...usersData[i], password: newPassword }

  const response = await fetch('./admin_users.php', {
    method: 'PUT',
    body: JSON.stringify(updatedUsersData),
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    msgArea.textContent = 'Error fetching data.'
    return
  }

  // json = [{userId, username, dateJoined, isAdmin}]
  const json = await response.json()

  if (!json.success) {
    // show error message
    msgArea.textContent = json.message
    return
  }

  renderUsers(json.data)

  // show success message
  msgArea.textContent = json.message
}

async function handleSaveEditUser(usersData, i) {
  const msgArea = document.getElementById('response-message')

  // gather the data from the input
  const editedUserData = {}

  for (const key of Object.keys(usersData[i])) {
    editedUserData[key] = document.getElementById(`input-${key}-${i}`).value
  }

  // prevent submission if name isn't valid
  // will give multiple messages if multiple problems are detected
  let errObj = { success: true, message: '' }

  errObj = validateUsername(errObj, editedUserData.username)

  if (!errObj.success) {
    msgArea.textContent = errObj.message
    return
  }

  const response = await fetch('./admin_users.php', {
    method: 'PATCH',
    body: JSON.stringify(editedUserData),
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    msgArea.textContent = 'Error fetching data.'
    return
  }

  const json = await response.json()

  if (!json.success) {
    // show error message
    msgArea.textContent = json.message
    return
  }

  renderUsers(json.data)

  // show success message
  msgArea.textContent = json.message
}

function handleEditUser(usersData, i) {
  // re-render for the case where someone edits a field while editing a different one
  renderUsers(usersData)

  // insert input into td's
  // disable any fields that shouldn't be allowed to be edited
  for (const [key, value] of Object.entries(usersData[i])) {
    const td = document.getElementById(`${key}-${i}`)
    td.innerHTML = `
      <input 
        type=${typeof value === 'string' ? 'text' : 'number'}
        id='input-${key}-${i}' 
        value=${value}
        ${key === 'userId' && 'disabled'}
        ${key === 'dateJoined' && 'disabled'}
        ${key === 'isAdmin' && 'disabled'}
        ${key === 'username' && value === 'admin' && 'disabled'}
      >`
  }

  // replace edit button with cancel & save buttons
  const editTd = document.getElementById(`editTd-${i}`)
  editTd.innerHTML = `
      <button type="button" id="cancelBtn">Cancel</button>
      <button type="button" id="saveBtn">Save</button>
    `

  document.getElementById('cancelBtn').addEventListener('click', () => renderUsers(usersData))
  document
    .getElementById('saveBtn')
    .addEventListener('click', () => handleSaveEditUser(usersData, i))

  document.getElementById(`input-username-${i}`).focus()
}

async function handleAddNewUser() {
  const msgArea = document.getElementById('response-message')

  const username = document.getElementById('username').value
  const password = document.getElementById('password').value
  const isAdminBool = document.getElementById('admin').checked
  const isAdmin = isAdminBool ? '1' : '0'

  // prevent submission if name or password isn't valid
  // will give multiple messages if multiple problems are detected
  let errObj = { success: true, message: '' }

  errObj = validateUsername(errObj, username)
  errObj = validatePassword(errObj, password)

  if (!errObj.success) {
    msgArea.textContent = errObj.message
    return
  }

  const response = await fetch('./admin_users.php', {
    method: 'POST',
    body: JSON.stringify({ username, password, isAdmin }),
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    msgArea.textContent = 'Error fetching data.'
    return
  }

  // if successful, this json will contain the updated users information so it can be rendered immediately
  const json = await response.json()

  if (!json.success) {
    // show error message
    msgArea.textContent = json.message
    return
  }

  renderUsers(json.data)

  // show success message
  msgArea.textContent = json.message
}

async function init() {
  // prevent unauthorized users from entering admin area
  checkAuth(true)

  // set up add user
  document.getElementById('addUserBtn').addEventListener('click', handleAddNewUser)

  // display existing users
  const usersData = await getData()

  // ie if something went wrong with the database (but not [])
  if (!usersData) return

  // print a message if there are no records
  if (usersData.length < 1) {
    document.getElementById('response-message').textContent = 'no users!?'
    return
  }

  renderUsers(usersData)
}

onload = init
