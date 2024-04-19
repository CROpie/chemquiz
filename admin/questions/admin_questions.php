<?php

// Check if able to fetch PHP response
// header("Content-Type: application/json");

// $response = array("success" => "Successfully accessed PHP.");

// echo json_encode($response);




require_once ("../../settings.php");
$conn = @mysqli_connect($host, $user, $pwd, $sql_db);

if (!$conn) {
    $response = array("error" => "Error connecting to the database.");
    echo json_encode($response);
    exit;
}

$username = 'chris';

$query = "SELECT *
FROM Users
";

$result = mysqli_query($conn, $query);

if (!$result) {
    $response = array("error" => "Query execution failure.");
    echo json_encode($response);
    exit;
}

$data = array();

while ($row = mysqli_fetch_assoc($result)) {
    $data[] = $row;
}

mysqli_free_result($result);

mysqli_close($conn);

header("Content-Type: application/json");
echo json_encode($data);





?>