<?php

require_once ("../../settings.php");

$conn = @mysqli_connect($host, $user, $pwd, $sql_db);
$sql_table = 'Users';

if (!$conn) {
    $response = array("error" => "Error connecting to the database.");
    echo json_encode($response);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] === "GET") {

    handleGetData($conn, $sql_table);
    exit;
}

function handleGetData($conn, $sql_table) {

$query = "SELECT gameId, username, score, attemptDate
FROM Scores
JOIN Users ON Users.userId = Scores.userId
";

$result = mysqli_query($conn, $query);


// validation of results
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

}


?>