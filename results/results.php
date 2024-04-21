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


// was thinking that the questions would have to be retrieved here, in order to render them on the next page
// however the questions are actually already stored in sessionStorage...

// questions = sessionStorage.getItem('questions')
// playerAnswers = sessionStorage.getItem('playerAnswers')
// results = [true, false, true, true, false] (send from here)

$playerScore = 0;
$playerResultsArray = array();

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
    } else if ($type === "reaction") {
        $query = "SELECT productInchi
        FROM ReactionQ
        WHERE reactionId = $questionId
        ";
    }

    $result = mysqli_query($conn, $query);

    $row = mysqli_fetch_assoc($result);

    $actualAnswer = '';

    if ($type === "structure") {
        $actualAnswer = $row["answer"];
    } else if ($type === "reaction") {
        $actualAnswer = $row["productInchi"];
    }
    
    if ($playerAnswer === $actualAnswer) {
        $playerScore += 1;
        $playerResultsArray[] = true;
    } else {
        $playerResultsArray[] = false;
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
    "userId" => $userId,
    "results" => $playerResultsArray
);

header("Content-Type: application/json");
echo json_encode($response);


mysqli_close($conn);


?>