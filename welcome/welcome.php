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

// called from login.js -> handleSubmit
if ($_SERVER["REQUEST_METHOD"] === "GET") {

    $response = handlePost($conn, $response);

    header("Content-Type: application/json");
    echo json_encode($response);
    mysqli_close($conn);
}

function handlePost($conn, $response) {

    // get the userId from queryParams
    $userId = sanitise_input($_GET["userId"]);

    // get leaderboard, number of attempts and highest scores
    $response["leaderBoard"] = queryForLeaderboard($conn);
    $response["attemptCount"] = queryForAttempts($conn, $userId);
    $response["highestScores"] = queryForScores($conn, $userId);

    // if any of the above requests failed (db problem), then return with an error message
    if ($response["leaderBoard"] === false || 
        $response["attemptCount"] === false || 
        $response["highestScores"] === false) {
        $response["message"] = "Something went wrong when querying the database..";
        return $response;
    }

    $response["success"] = true;

    return $response;

}

function queryForLeaderboard($conn) {
    $query = "  SELECT Users.userId, Users.username, Scores.attemptDate, max(Scores.score) AS topScore
                FROM Users
                JOIN Scores ON Users.userId=Scores.userId
                GROUP BY Users.userId, Users.username
                ORDER BY topScore DESC
                LIMIT 5;";

    $result = mysqli_query($conn, $query);

    // catching db failure
    if (!$result) {
        return false;
    }

    $leaderBoard = array();

    while ($row = mysqli_fetch_assoc($result)) {
        $leaderBoard[] = $row;
    }

    mysqli_free_result($result);

    return $leaderBoard;
}

function queryForAttempts($conn, $userId) {
    $query = "  SELECT count(*)
                FROM Scores
                WHERE Scores.userId='$userId'";

    $result = mysqli_query($conn, $query);

    // catching db failure
    if (!$result) {
        return false;
    }

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

    // catching db failure
    if (!$result) {
        return false;
    }

    $highestScores=array();

    while($row = mysqli_fetch_assoc($result)) {
        $highestScores[] = $row;
    }

    mysqli_free_result($result);

    return $highestScores;
}

?>