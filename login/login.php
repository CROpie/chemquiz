<?php

// Check if able to fetch PHP response
// header("Content-Type: application/json");
// $response = array("success" => "Successfully accessed PHP.");
// echo json_encode($response);

require_once ("../settings.php");
require_once("../utils/sanitiseinput.php");
$conn = @mysqli_connect($host, $user, $pwd, $sql_db);

if (!$conn) {
    $response = array("error" => "Error connecting to the database.");
    echo json_encode($response);
    exit;
}

// get the data that was posted, and send it to a function to sanitise it
$username = sanitise_input($_POST["username"]);
$password = sanitise_input($_POST["password"]);

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

$checkVerify = password_verify($password, $row["password"]);

// determine the outcome
if (!$row) {
    $response["message"] = "User not found.";
} else if (!$result) {
    $response["message"] = "Error connecting to database";
} else if (!password_verify($password, $row["password"])) {
    $response["message"] = "The password you entered is incorrect.";
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