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

$userId = $_GET["userId"];

// get the data that was posted
$jsonData = file_get_contents('php://input');

// $playerAnswersData: [{answerType: "stucture" | "reaction" | ... , userAnswer: string, questionId: number }, ... ]
$playerAnswersData = json_decode($jsonData, true);

$playerScore = 0;

for ($i = 0; $i < count($playerAnswersData); $i++) {

    $type = $playerAnswersData[$i]["answerType"];
    $playerAnswer = $playerAnswersData[$i]["userAnswer"];
    $questionId = $playerAnswersData[$i]["questionId"];

    $query = '';

    if ($type === "structure") {
        $query = "SELECT answer
        FROM StructureQ
        WHERE structureId = $questionId
    ";
    }

    $result = mysqli_query($conn, $query);

    $row = mysqli_fetch_assoc($result);

    $actualAnswer = $row["answer"];
    
    if ($playerAnswer === $actualAnswer) {
        $playerScore += 1;
    }
    mysqli_free_result($result);
}

// store the score on the database

// get updated score data for the player (and all players?)

// prepare an object that will be sent back to client
$response = array(
    "success" => true,
    "message" => "",
    "score" => $playerScore,
    "userId" => $userId
);

header("Content-Type: application/json");
echo json_encode($response);


mysqli_close($conn);


?>