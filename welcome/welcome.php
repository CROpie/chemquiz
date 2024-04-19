<?php

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

// get the password for that particular username from the database
$query = "SELECT score, attemptDate
FROM Scores
JOIN Users ON Users.userId = Scores.userId
WHERE Users.username = '$username'
";

$result = mysqli_query($conn, $query);

// prepare an object that will be sent back to client
$response = array(
    "success" => false,
    "message" => ""
);

$data = array();

while ($row = mysqli_fetch_assoc($result)) {
    $data[] = $row;
}

// determine the outcome
if (empty($data)) {
    // if the array has no values, ie no rows were returned
    $response["success"] = true;
    $response["message"] = "no rows returned";
} else if (!$result) {
    $response["message"] = "error connecting to database";
} else {
    $response["success"] = true;
    $response["data"] = $data;
}

header("Content-Type: application/json");
echo json_encode($response);

mysqli_free_result($result);
mysqli_close($conn);

?>