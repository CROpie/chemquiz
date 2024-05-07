<?php

require_once ("../../../settings.php");
require_once("../../../utils/sanitiseinput.php");

$sql_table = "ReactionQ";

$response = array(
    "success" => false,
    "message" => "",
);

// attempt to create a connection to the database
try {
    $conn = mysqli_connect($host, $user, $pwd, $sql_db);
} catch (mysqli_sql_exception $e) {
    $response["message"] = $e->getMessage();
    echo json_encode($response);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] === "DELETE") {
    $response = handleDeleteData($conn, $sql_table, $response);

    header("Content-Type: application/json");
    echo json_encode($response);
    
    mysqli_close($conn);

    exit;
}

if ($_SERVER["REQUEST_METHOD"] === "GET") {
    $response = handleGetData($conn, $sql_table, $response);

    header("Content-Type: application/json");
    echo json_encode($response);
    
    mysqli_close($conn);

    exit;
}

if ($_SERVER["REQUEST_METHOD"] === "PUT") {
    $response = handlePutData($conn, $sql_table, $response);

    header("Content-Type: application/json");
    echo json_encode($response);
    
    mysqli_close($conn);

    exit;
} 

function handleGetData($conn, $sql_table, $response) {

    $query = "SELECT *
    FROM $sql_table
    ORDER BY ReactionId DESC
    ";

    $result = mysqli_query($conn, $query);

    if (!$result) {
        $response["message"] = "error connecting to database..";
        return $response;
    } 

    $data = array();

    while ($row = mysqli_fetch_assoc($result)) {
        $data[] = $row;
    }

    $response["success"] = true;
    $response["data"] = $data;

    // not sure if this is necessary.
    // $result is defined inside this function, so when $response is returned,
    // $result ceases to exist anyway
    mysqli_free_result($result);

    return $response;
}

function handlePutData($conn, $sql_table, $response) {
    $data = file_get_contents("php://input");
    $jsonData = json_decode($data, true);

    // if adding a new question, this will be null
    $reactionId = sanitise_input($jsonData["reactionId"]);

    $reactant = sanitise_input($jsonData["reactant"]);
    $reagent = sanitise_input($jsonData["reagent"]);
    $productSmile = sanitise_input($jsonData["productSmile"]);
    $productInchi = sanitise_input($jsonData["productInchi"]);
    $catalyst = sanitise_input($jsonData["catalyst"]);
    $solvent = sanitise_input($jsonData["solvent"]);
    $temperature = sanitise_input($jsonData["temperature"]);
    $time = sanitise_input($jsonData["time"]);
    $difficulty = sanitise_input($jsonData["difficulty"]);


    $query = '';

    if ($reactionId) {
        $query = "UPDATE $sql_table
        SET 
        reactant = '$reactant',
        reagent = '$reagent',
        productSmile = '$productSmile',
        productInchi = '$productInchi',
        catalyst = '$catalyst',
        solvent = '$solvent',
        temperature = '$temperature',
        time = '$time',
        difficulty = '$difficulty'
        WHERE reactionId = $reactionId";
    } else {
        $query = "INSERT INTO $sql_table (reactant, reagent, productSmile, productInchi, catalyst, solvent, temperature, time, difficulty)
        VALUES
        ('$reactant','$reagent','$productSmile','$productInchi','$catalyst','$solvent','$temperature','$time','$difficulty')";
    }

    $result = mysqli_query($conn, $query);

    if (!$result) {
        $response["message"] = "error connecting to database..";
        return $response;
    }

    $response["success"] = true;
    $response["message"] = "Successfully added or modified question.";

    // Obtain the updated data
    $response = handleGetData($conn, $sql_table, $response);

    return $response;
}

function handleDeleteData($conn, $sql_table, $response) {
    $reactionId = sanitise_input($_GET["reactionId"]);

    $query = "DELETE FROM $sql_table
    WHERE
    reactionId = $reactionId";

    $result = mysqli_query($conn, $query);

    if (!$result) {
        $response["message"] = "error connecting to database..";
        return $response;
    }

    $response["success"] = true;
    $response["message"] = "Successfully deleted question.";

    // Obtain the updated data
    $response = handleGetData($conn, $sql_table, $response);

    return $response;
}

?>