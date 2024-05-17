<?php

require_once ("../../../settings.php");
require_once("../../../utils/sanitiseinput.php");

$sql_table = "StructureQ";

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
    ORDER BY StructureId DESC
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

    if (!validateUniqueResponses($jsonData)) {
        $response["message"] = "Error: all options must be unique.";
        return $response;
    }

    // if adding a new question, this will be null
    $structureId = sanitise_input($jsonData["structureId"]);
    
    $molecule = sanitise_input($jsonData["molecule"]);
    $answer = sanitise_input($jsonData["answer"]);
    $incorrect1 = sanitise_input($jsonData["incorrect1"]);
    $incorrect2 = sanitise_input($jsonData["incorrect2"]);
    $incorrect3 = sanitise_input($jsonData["incorrect3"]);
    $difficulty = sanitise_input($jsonData["difficulty"]);

    $query = '';

    if (!$structureId) {
        $query = "INSERT INTO $sql_table (molecule, answer, incorrect1, incorrect2, incorrect3, difficulty)
        VALUES
        ('$molecule','$answer','$incorrect1','$incorrect2','$incorrect3','$difficulty')";
    } else {
        $query = "UPDATE $sql_table
        SET 
        molecule = '$molecule',
        answer = '$answer',
        incorrect1 = '$incorrect1',
        incorrect2 = '$incorrect2',
        incorrect3 = '$incorrect3',
        difficulty = '$difficulty'
        WHERE structureId = $structureId";
    }

    // if ($structureId) {
    //     $query = "UPDATE $sql_table
    //     SET 
    //     molecule = '$molecule',
    //     answer = '$answer',
    //     incorrect1 = '$incorrect1',
    //     incorrect2 = '$incorrect2',
    //     incorrect3 = '$incorrect3',
    //     difficulty = '$difficulty'
    //     WHERE structureId = $structureId";
    // } else {
    //     $query = "INSERT INTO $sql_table (molecule, answer, incorrect1, incorrect2, incorrect3, difficulty)
    //     VALUES
    //     ('$molecule','$answer','$incorrect1','$incorrect2','$incorrect3','$difficulty')";
    // }

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
    $structureId = sanitise_input($_GET["structureId"]);

    $query = "DELETE FROM $sql_table
    WHERE
    structureId = $structureId";

    $result = mysqli_query($conn, $query);

    if (!$result) {
        $response["message"] = "error connecting to database..";
        return $response;
    }

    // Obtain the updated data
    $response = handleGetData($conn, $sql_table, $response);

    $response["success"] = true;
    $response["message"] = "Successfully deleted question.";

    return $response;
}

function validateUniqueResponses($jsonData) {
    // Set() doesn't exist in PHP, but this has the same effect
    // the "key" for the associative array has to be unique
    // therefore if there are duplicates, the number of keys in the array will be less than 4
    $uniqueStrings = [];
    $uniqueStrings[$jsonData["answer"]] = true;
    $uniqueStrings[$jsonData["incorrect1"]] = true;
    $uniqueStrings[$jsonData["incorrect2"]] = true;
    $uniqueStrings[$jsonData["incorrect3"]] = true;

    if (count($uniqueStrings) === 4) {
        return true;
    }
    return false;
}

?>