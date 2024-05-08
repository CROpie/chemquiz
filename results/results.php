<?php

require_once ("../settings.php");
require_once("../utils/sanitiseinput.php");

// prepare an object that will be sent back to client
$response = array(
    "success" => false,
    "message" => ""
);

// attempt to create a connection to the database
try {
    $conn = mysqli_connect($host, $user, $pwd, $sql_db);
} catch (mysqli_sql_exception $e) {
    $response["message"] = $e->getMessage();
    echo json_encode($response);
    exit;
}

// called from welcome.js -> handleStartGame
if ($_SERVER["REQUEST_METHOD"] === "POST") {

    $response = handlePost($conn, $response);

    header("Content-Type: application/json");
    echo json_encode($response);
    mysqli_close($conn);
}

function handlePost($conn, $response) {

    $userId = sanitise_input($_GET["userId"]);

    // get the data that was posted
    $jsonData = file_get_contents('php://input');

    // $playerAnswersData: [{answerType: "structure" | "reaction" | ... , userAnswer: string, questionId: number }, ... ]
    $playerAnswersData = json_decode($jsonData, true);

    // determine the player's score, and generate an array which shows which questions they got correct ([true, false, true, ...])
    $playerScore = 0;
    $playerResultsArray = array();
    $queryError = false;

    for ($i = 0; $i < count($playerAnswersData); $i++) {

        // get the question from the database
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

        if (!$result) {
            $queryError = true;
            break;
        }

        $row = mysqli_fetch_assoc($result);

        // determine if the user correctly answered the question
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

    // if any of the queries to the database failed, return early & prevent storage of faulty data
    if ($queryError) {
        $response["message"] = "Something went wrong when interacting with the database.";
        return $response;
    }

    // store the score on the database
    $storeScoreResult = queryStoreScore($conn, $userId, $playerScore);

    // get updated score data of the leaderboard, number of attempts and highest scores
    $leaderBoard = queryForLeaderboard($conn);
    $attemptCount = queryForAttempts($conn, $userId);
    $highestScores = queryForScores($conn, $userId);

    if ($scoreScoreResult === false ||
        $leaderBoard === false ||
        $attemptCount === false ||
        $highestScores === false) {
            $response["message"] = "Something went wrong when interacting with the database.";
            return $response;
        }

    // add the data to the response object
    $response["success"] = true;
    $response["score"] = $playerScore;
    $response["results"] = $playerResultsArray;
    $response["leaderBoard"] = $leaderBoard;
    $response["attemptCount"] = $attemptCount;
    $response["highestScores"] = $highestScores;

    return $response;
}

function queryStoreScore($conn, $userId, $playerScore) {
    $query = "  INSERT INTO Scores(userId,score)
                VALUES($userId, $playerScore);";

    $result = mysqli_query($conn, $query);

    if (!$result) return false;

    return true;
}

function queryForLeaderboard($conn) {
    $query = "  SELECT Users.userId, Users.username, Scores.attemptDate, max(Scores.score) AS topScore
                FROM Users
                JOIN Scores ON Users.userId=Scores.userId
                GROUP BY Users.userId, Users.username
                ORDER BY topScore DESC
                LIMIT 5;";

    $result = mysqli_query($conn, $query);

    if (!$result) return false;

    $leaderBoard=array();

    while ($row = mysqli_fetch_assoc($result)) {
        $leaderBoard[]=$row;
    }

    mysqli_free_result($result);

    return $leaderBoard;
}

function queryForAttempts($conn, $userId) {
    $query = "  SELECT count(*)
                FROM Scores
                WHERE Scores.userId='$userId'";

    $result = mysqli_query($conn, $query);

    if (!$result) return false;

    $row = mysqli_fetch_assoc($result);

    $attemptCount = $row["count(*)"];

    mysqli_free_result($result);

    return $attemptCount;
}

function queryForScores($conn, $userId) {
    $query = "  SELECT score, attemptDate
                FROM Scores 
                WHERE Scores.UserId='$userId'
                ORDER BY attemptDate DESC
                LIMIT 5;";
    
    $result = mysqli_query($conn, $query);

    if (!$result) return false;

    $highestScores=array();

    while($row = mysqli_fetch_assoc($result)) {
        $highestScores[] = $row;
    }

    mysqli_free_result($result);

    return $highestScores;
}

?>
