<?php

require_once ("../settings.php");
$conn = @mysqli_connect($host, $user, $pwd, $sql_db);

// prepare an object that will be sent back to client
$response = array(
    "success" => false,
    "message" => ""
);

if (!$conn) {
    $response = array("error" => "Error connecting to the database.");
    echo json_encode($response);
    exit;
}

// determine whether the user wants difficult questions or not
// convert to 0 or 1 for use in SQL query
$isDifficult = $_GET["isDifficult"];
$difficulty = $isDifficult === "true" ? "1" : "0";

$noReactionQs = 2;
$noStructureQs = 2;

// get a random number of the different question types
// for ($i = 0; $i < 3; $i++) {
//     $rand = rand(0,1);
//     if ($rand == 0) $noReactionQs++;

//     if ($rand == 1) $noStructureQs++;
// }

$data = array();

// STRUCTURE QUESTIONS
$query = "SELECT structureId, molecule, answer, incorrect1, incorrect2, incorrect3
FROM StructureQ
WHERE difficulty = $difficulty
ORDER BY RAND()
LIMIT $noStructureQs;
";

$result = mysqli_query($conn, $query);

while ($row = mysqli_fetch_assoc($result)) {
    $data[] = $row;
}

mysqli_free_result($result);

// REACTION QUESTIONS
$query = "SELECT *
FROM ReactionQ
WHERE difficulty = $difficulty
ORDER BY RAND()
LIMIT $noReactionQs
";

$result = mysqli_query($conn, $query);

while ($row = mysqli_fetch_assoc($result)) {
    $data[] = $row;
}

mysqli_free_result($result);

$response["success"] = true;
$response["data"] = $data;

header("Content-Type: application/json");
echo json_encode($response);


mysqli_close($conn);

?>