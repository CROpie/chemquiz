<?php

require_once ("../settings.php");
$conn = @mysqli_connect($host, $user, $pwd, $sql_db);

if (!$conn) {
    $response = array("error" => "Error connecting to the database.");
    echo json_encode($response);
    exit;
}

// get the data that was posted
// don't need to get the usernames?
// $jsonData = file_get_contents('php://input');

// $data = json_decode($jsonData, true); 

// $username = trim($data["username"]);

// $noReactionQs = 0;
$noStructureQs = 3;

// get a random number of the different question types
// for ($i = 0; $i < 3; $i++) {
//     $rand = rand(0,1);
//     if ($rand == 0) $noReactionQs++;

//     if ($rand == 1) $noStructureQs++;
// }


$query = "SELECT structureId, molecule, answer, incorrect1, incorrect2, incorrect3
FROM StructureQ
ORDER BY RAND()
LIMIT $noStructureQs;
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