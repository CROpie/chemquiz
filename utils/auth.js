// authArea = true if running the function from the admin area
export function checkAuth(adminArea) {
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo'))

  if (!userInfo) {
    // user has no session, or user isn't an admin: redirect to login
    window.location.href = '../index.html?error=unauthorized'
    return
  }

  if (adminArea && userInfo.isAdmin !== '1') {
    // user trying to access admin area when they are not authorized
    window.location.href = '../index.html?error=unauthorized'
    return
  }
}
