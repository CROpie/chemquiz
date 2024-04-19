async function getData() {
  const response = await fetch('./admin_users.php')
  if (!response.ok) {
    console.log('something went wrong')
    return
  }

  const json = await response.json()

  return json
}

async function handleDelete(userId) {
  const response = await fetch(`./admin_users.php?userId=${userId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    console.log('something went wrong...')
    return
  }

  // if successful, this json will contain the updated users information so it can be rendered immediately
  const json = await response.json()

  renderUsers(json)

  console.log(json)
}

function renderUsers(usersData) {
  const TBODY = document.getElementById('tbody')

  // if TBODY has any data, clear it
  // this is important after making a change, so you don't get row duplication
  TBODY.innerHTML = ''

  for (let i = 0; i < usersData.length; i++) {
    const trow = document.createElement('tr')

    const rowTemplate = `
      <td>${usersData[i].userId}</td>
      <td>${usersData[i].username}</td>
      <td>${usersData[i].dateJoined}</td>
      <td>${usersData[i].isAdmin === '1' ? 'yes' : 'no'}</td>
      <td><button id="delBtn-${i}">X</button></td>
    `

    trow.innerHTML = rowTemplate
    TBODY.appendChild(trow)

    // set up del button event
    document
      .getElementById(`delBtn-${i}`)
      .addEventListener('click', () => handleDelete(usersData[i].userId))
  }
}

async function handleAddNewUser() {
  const username = document.getElementById('username').value
  const password = document.getElementById('password').value
  const isAdminBool = document.getElementById('admin').checked
  const isAdmin = isAdminBool ? '1' : '0'

  const response = await fetch('./admin_users.php', {
    method: 'POST',
    body: JSON.stringify({ username, password, isAdmin }),
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    console.log('something went wrong...')
    return
  }

  // if successful, this json will contain the updated users information so it can be rendered immediately
  const json = await response.json()

  renderUsers(json)

  console.log(json)
}

async function init() {
  // set up add user
  document.getElementById('addUserBtn').addEventListener('click', handleAddNewUser)

  // display existing users
  const usersData = await getData()

  renderUsers(usersData)
}

onload = init
