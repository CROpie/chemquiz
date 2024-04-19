function init() {
  document.getElementById('submitBtn').addEventListener('click', handleSubmit)
}

async function handleSubmit() {
  const username = document.getElementById('username').value
  const password = document.getElementById('password').value

  if (!username || !password) return

  const response = await fetch('./login.php', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    console.log('something went wrong')
    return
  }

  const json = await response.json()

  console.log(json)

  // handle failure to log in
  if (!json.success) {
    console.log(json.message)
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
    body: JSON.stringify({ username }),
    headers: {
      'Content-Type': 'application/json',
    },
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
