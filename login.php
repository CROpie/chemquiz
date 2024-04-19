<?php

// Check if able to fetch PHP response
// header("Content-Type: application/json");
// $response = array("success" => "Successfully accessed PHP.");
// echo json_encode($response);

require_once ("../settings.php");
$conn = @mysqli_connect($host, $user, $pwd, $sql_db);

if (!$conn) {
    $response = array("error" => "Error connecting to the database.");
    echo json_encode($response);
    exit;
}

// get the data that was posted
$jsonData = file_get_contents('php://input');

$data = json_decode($jsonData, true); 

$username = trim($data["username"]);
$password = trim($data["password"]);

// don't need to do this
// $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

// view the data that was sent up (by sending it back down)
// $responseData = array(
//     "username" => $username,
//     "password" => $password
// )
// header("Content-Type: application/json");
// echo json_encode($responseData);

// get the password for that particular username from the database
$query = "SELECT *
FROM Users
WHERE username = '$username'
";

$result = mysqli_query($conn, $query);

// prepare an object that will be sent back to client
$response = array(
    "success" => false,
    "message" => ""
);

// will either be a row or null
$row = mysqli_fetch_assoc($result);

/* else if ($row["password"] !== $hashedPassword)
    this surprisingly didn't work
    the hash produced changed each time? due to a random salt or something
    need to use the password_verify(plaintext, hashed) instead
*/

$checkVerify = password_verify($password, $row["password"]);

// determine the outcome
if (!$row) {
    $response["message"] = "no rows returned";
} else if (!$result) {
    $response["message"] = "error connecting to database";
} else if (!password_verify($password, $row["password"])) {
    $response["message"] = "incorrect password";
} else {
    $response["success"] = true;
    $response["isAdmin"] = $row["isAdmin"];
    $response["userId"] = $row["userId"];
}

header("Content-Type: application/json");
echo json_encode($response);

mysqli_free_result($result);
mysqli_close($conn);

?>