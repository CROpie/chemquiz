<?php

require_once ("../../settings.php");
require_once("../../utils/sanitiseinput.php");

$sql_table = 'Scores';

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

if ($_SERVER["REQUEST_METHOD"] === "GET") {
    $response = handleGetData($conn, $sql_table, $response);

    echo json_encode($response);
    
    mysqli_close($conn);

    exit;
}

if ($_SERVER["REQUEST_METHOD"] === "PATCH") {
    $response = handlePatchData($conn, $sql_table, $response);
    
    echo json_encode($response);
    
    mysqli_close($conn);

    exit;
}

if ($_SERVER["REQUEST_METHOD"] === "DELETE") {
    $response = handleDeleteData($conn, $sql_table, $response);
    
    echo json_encode($response);
    
    mysqli_close($conn);

    exit;
}

function handleGetData($conn, $sql_table, $response) {

    $query = "SELECT gameId, username, score, attemptDate
    FROM $sql_table
    JOIN Users ON Users.userId = Scores.userId
    ";

    $result = mysqli_query($conn, $query);

    // error handling for unable to connect to db
    if (!$result) {
        $response["message"] =  "Couldn't fetch the data.";
        return $response;
    }

    $data = array();

    while ($row = mysqli_fetch_assoc($result)) {
        $data[] = $row;
    }

    $response["success"] = true;
    $response["data"] = $data;

    mysqli_free_result($result);

    return $response;
}

function handlePatchData($conn, $sql_table, $response) {
    // get the data that was posted
    $jsonData = file_get_contents('php://input');

    // $editScoreData: {gameId: number, username: string, score: number, attemptDate: string}
    $editScoreData = json_decode($jsonData, true);

    // extract the relevant properties
    $gameId = sanitise_input($editScoreData["gameId"]);
    $score = sanitise_input($editScoreData["score"]);

    // validate user inputted data
    if (!validateScore($score)) {
        $response["message"] = "Error: invalid score. Scores must be between 0 and 10 inclusive.";
        return $response;
    }

    // write the sql query
    $query = "UPDATE Scores
    SET score = '$score'
    WHERE gameId = '$gameId';";

    $result = mysqli_query($conn, $query);

    // error handling for unable to connect to db
    if (!$result) {
        $response["message"] = "Error: failed to add the user to the database.";
        return $response;
    }

    $response["success"] = true;
    $response["message"] = "Successfully changed the score.";

    // no error, so get the updated data from the database
    $response = handleGetData($conn, $sql_table, $response);

    return $response;
}

function handleDeleteData($conn, $sql_table) {

    // get the user id from query parameters
    $gameId = sanitise_input($_GET['gameId']);

    // write the sql query
    $query = "DELETE FROM $sql_table
        WHERE
        gameId = $gameId";

    $result = mysqli_query($conn, $query);

    // error handling for unable to connect to db
    if (!$result) {
        $response["message"] = "Error: failed to add the user to the database.";
        return $response;
    }

    $response["success"] = true;
    $response["message"] = "Successfully deleted the record.";

    // success, so get the updated data
    $response = handleGetData($conn, $sql_table, $response);

    return $response;
}

function validateScore($score) {
    if (!preg_match("/^[0-9]+$/", $score)) {
        return false;
    }
    if ((int) $score < 0 || (int) $score > 10) {
        return false;
    }
    return true;
}
?>