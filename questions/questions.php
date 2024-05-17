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
if ($_SERVER["REQUEST_METHOD"] === "GET") {

    $response = handlePost($conn, $response);

    header("Content-Type: application/json");
    echo json_encode($response);
    mysqli_close($conn);
}

function handlePost($conn, $response) {

    // determine whether the user wants difficult questions or not
    // convert to 0 or 1 for use in SQL query
    $isDifficult = sanitise_input($_GET["isDifficult"]);
    $difficulty = $isDifficult === "true" ? "1" : "0";

    $noReactionQs = 0;
    $noStructureQs = 0;

    // get a random number of the different question types
    for ($i = 0; $i < 10; $i++) {
        $rand = rand(0,1);
        if ($rand == 0) $noReactionQs++;

        if ($rand == 1) $noStructureQs++;
    }

    // add structure Qs to data array
    $structureQs = queryForStructureQuestions($conn, $data, $difficulty, $noStructureQs);

    if ($structureQs === false) {
        $response["message"] = "Something went wrong when getting the questions from the database.";
        return $response;
    }

    // add reaction Qs to data array
    $reactionQs = queryForReactionQuestions($conn, $data, $difficulty, $noReactionQs);

    if ($reactionQs === false) {
        $response["message"] = "Something went wrong when getting the questions from the database.";
        return $response;
    }

    // create an array which will store all the questions retrieved from the database
    $data = array_merge($structureQs, $reactionQs);

    $response["success"] = true;
    $response["data"] = $data;

    return $response;

}

function queryForStructureQuestions($conn, $data, $difficulty, $noStructureQs) {
    $query = "SELECT structureId, molecule, answer, incorrect1, incorrect2, incorrect3
    FROM StructureQ
    WHERE difficulty = $difficulty
    ORDER BY RAND()
    LIMIT $noStructureQs;
    ";
    
    $result = mysqli_query($conn, $query);

    // handle db error
    if (!$result) return false;
    
    while ($row = mysqli_fetch_assoc($result)) {
        $data[] = $row;
    }
    
    mysqli_free_result($result);

    return $data;
}

function queryForReactionQuestions($conn, $data, $difficulty, $noReactionQs) {
    $query = "SELECT *
    FROM ReactionQ
    WHERE difficulty = $difficulty
    ORDER BY RAND()
    LIMIT $noReactionQs
    ";
    
    $result = mysqli_query($conn, $query);

    // handle db error
    if (!$result) return false;
    
    while ($row = mysqli_fetch_assoc($result)) {
        $data[] = $row;
    }
    
    mysqli_free_result($result);

    return $data;
}

?>