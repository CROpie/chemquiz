async function handleGetData() {
  const response = await fetch('./admin_questions.php')
  if (!response.ok) {
    console.log('something went wrong')
    return
  }

  const json = await response.json()

  console.log(json)
}

handleGetData()
