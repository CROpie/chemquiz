<?php

require_once ("../settings.php");
require_once("../utils/sanitiseinput.php");

// prepare an object that will be sent back to client
$response = array(
    "success" => false,
    "message" => ""
);

$conn = @mysqli_connect($host, $user, $pwd, $sql_db);

if (!$conn) {
    $response = array("error" => "Error connecting to the database.");
    echo json_encode($response);
    exit;
}

// get the userId from queryParams
$userId = sanitise_input($_GET["userId"]);

// get leaderboard, number of attempts and highest scores
$leaderBoard = queryForLeaderboard($conn, $userId);
$attemptCount = queryForAttempts($conn, $userId);
$highestScores = queryForScores($conn, $userId);


// $query = "SELECT score, attemptDate
// FROM Scores
// JOIN Users ON Users.userId = Scores.userId
// WHERE Users.username = '$username'
// ";

$response["leaderBoard"] = $leaderBoard;
$response["attemptCount"] = $attemptCount;
$response["highestScores"] = $highestScores;

$response["success"] = true;


header("Content-Type: application/json");
echo json_encode($response);

mysqli_close($conn);

function queryForLeaderboard($conn, $userId) {
    $query = "  SELECT Users.userId, Users.username, Scores.attemptDate, max(Scores.score) AS topScore
                FROM Users
                JOIN Scores ON Users.userId=Scores.userId
                WHERE Users.userId=$userId
                GROUP BY Users.userId, Users.username
                ORDER BY topScore
                LIMIT 5;";

    $result = mysqli_query($conn, $query);

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

    $highestScores=array();

    while($row = mysqli_fetch_assoc($result)) {
        $highestScores[] = $row;
    }

    mysqli_free_result($result);

    return $highestScores;
}

?>