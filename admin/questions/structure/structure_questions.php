<?php

require_once ("../../../settings.php");
$conn = @mysqli_connect($host, $user, $pwd, $sql_db);
$sql_table = "StructureQ";

$response = array(
    "success" => false,
    "message" => "",
    "data" => null
);

if (!$conn) {
    $response = array("error" => "Error connecting to the database.");
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

    // if adding a new question, this will be null
    $structureId = $jsonData["structureId"];

    $query = '';

    if ($structureId) {
        $query = "UPDATE $sql_table
        SET 
        molecule = '{$jsonData["molecule"]}',
        answer = '{$jsonData["answer"]}',
        incorrect1 = '{$jsonData["incorrect1"]}',
        incorrect2 = '{$jsonData["incorrect2"]}',
        incorrect3 = '{$jsonData["incorrect3"]}',
        difficulty = '{$jsonData["difficulty"]}'
        WHERE structureId = $structureId";
    } else {
        $query = "INSERT INTO $sql_table (molecule, answer, incorrect1, incorrect2, incorrect3, difficulty)
        VALUES
        ('{$jsonData["molecule"]}','{$jsonData["answer"]}','{$jsonData["incorrect1"]}','{$jsonData["incorrect2"]}','{$jsonData["incorrect3"]}','{$jsonData["difficulty"]}')";
    }

    $result = mysqli_query($conn, $query);

    if (!$result) {
        $response["message"] = "error connecting to database..";
        return $response;
    }

    // Obtain the updated data
    $response = handleGetData($conn, $sql_table, $response);

    return $response;
}

function handleDeleteData($conn, $sql_table, $response) {
    $structureId = $_GET["structureId"];

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

    return $response;
}

?>