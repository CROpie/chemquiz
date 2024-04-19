<?php

require_once ("../../settings.php");

$conn = @mysqli_connect($host, $user, $pwd, $sql_db);
$sql_table = 'Users';

if (!$conn) {
    $response = array("error" => "Error connecting to the database.");
    echo json_encode($response);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] === "GET") {
    handleGetData($conn, $sql_table);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    handlePostData($conn, $sql_table);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] === "DELETE") {
    handleDeleteData($conn, $sql_table);
    exit;
}

function handleGetData($conn, $sql_table) {

    $query = "SELECT userId, username, dateJoined, isAdmin
    FROM Users
    ";

    $result = mysqli_query($conn, $query);


    // error handling for unable to connect to db
    if (!$result) {
        $response = array("error" => "Query execution failure.");
        echo json_encode($response);
        exit;
    }

    $data = array();

    while ($row = mysqli_fetch_assoc($result)) {
        $data[] = $row;
    }

    mysqli_free_result($result);

    mysqli_close($conn);

    header("Content-Type: application/json");
    echo json_encode($data);

}

function handlePostData($conn, $sql_table) {

    // get the data that was posted
    $jsonData = file_get_contents('php://input');

    // $newUserData: {username: string, password: string, isAdmin: "0" | "1"}
    $newUserData = json_decode($jsonData, true);

    $username = $newUserData["username"];
    $password = $newUserData["password"];
    $isAdmin = $newUserData["isAdmin"];

    // hash the password
    $hashed_password = password_hash($password, PASSWORD_BCRYPT);

    // write the sql query
    $query = "INSERT INTO Users (username, password, isAdmin)
    VALUES
    ('$username', '$hashed_password', '$isAdmin')
    ";

    $result = mysqli_query($conn, $query);


    // error handling for unable to connect to db
    if (!$result) {
        $response = array("error" => "Query execution failure.");
        echo json_encode($response);
        exit;
    }

    // can't run this statement after an UPDATE query
    // mysqli_free_result($result);

    // no error, so get the updated data from the database
    handleGetData($conn, $sql_table);
}

function handleDeleteData($conn, $sql_table) {

    // get the user id from query parameters
    $userId = $_GET['userId'];

    // write the sql query
    $query = "DELETE FROM $sql_table
        WHERE
        userId = $userId";

    $result = mysqli_query($conn, $query);

    // error handling for unable to connect to db
    if (!$result) {
        $response = array("error" => "Query execution failure.");
        echo json_encode($response);
        exit;
    }

    // success, so get the updated data
    handleGetData($conn, $sql_table);
}

?>