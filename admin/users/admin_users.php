<?php

require_once ("../../settings.php");
require_once("../../utils/sanitiseinput.php");

$sql_table = 'Users';

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

if ($_SERVER["REQUEST_METHOD"] === "PUT") {
    $response = handlePutData($conn, $sql_table, $response);

    echo json_encode($response);
    
    mysqli_close($conn);
    
    exit;
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $response = handlePostData($conn, $sql_table, $response);

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

    $query = "SELECT userId, username, dateJoined, isAdmin
    FROM Users
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

function handlePostData($conn, $sql_table, $response) {

    // get the data that was posted
    $jsonData = file_get_contents('php://input');

    // $newUserData: {username: string, password: string, isAdmin: "0" | "1"}
    $newUserData = json_decode($jsonData, true);

    $username = sanitise_input($newUserData["username"]);
    $password = sanitise_input($newUserData["password"]);
    $isAdmin = sanitise_input($newUserData["isAdmin"]);

    // validate user inputted data
    if (!validateUsername($username)) {
        $response["message"] = "Error: invalid username. Only alphanumeric characters are allowed.";
        return $response; 
    }

    if (!validatePassword($password)) {
        $response["message"] = "Error: invalid password. Needs at least 8 characters.";
        return $response; 
    }

    if (!validateIsAdmin($isAdmin)) {
        $response["message"] = "Error: invalid admin status. Not sure how that was possible!";
        return $response; 
    }


    // if checkDuplicate returns data that means that a record was found for that username
    // so prevent adding another entry
    if (checkDuplicate($conn, $sql_table, $username)) {
        $response["message"] = "Error: couldn't complete the request. That username already exists.";
        return $response; 
    }

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
        $response["message"] = "Error: failed to add the user to the database.";
        return $response; 
    }

    $response["success"] = true;
    $response["message"] = "Successfully added $username to database.";

    // no error, so get the updated data from the database
    $response = handleGetData($conn, $sql_table, $response);

    return $response; 
}

function handlePatchData($conn, $sql_table, $response) {
    // get the data that was posted
    $jsonData = file_get_contents('php://input');
    
    // $editUserData: {userId: number, username: string, dateJoined: string, isAdmin: "0" | "1"} || {userId: number, password: string}
    $patchUserData = json_decode($jsonData, true);

    $userId = sanitise_input($patchUserData["userId"]);
    $username = sanitise_input($patchUserData["username"]);

    // validate user inputted data
    if (!validateUsername($username)) {
        $response["message"] = "Error: invalid username. Only alphanumeric characters are allowed.";
        return $response; 
    }

    // if checkDuplicate returns data, that means that a record was found for that username
    // so need prevent modifying to an existing username
    if (checkDuplicate($conn, $sql_table, $username)) {
        $response["message"] = "Error: can't change to that username since it already exists.";
        return $response; 
    }

    // write the sql query
    $query = "  UPDATE Users
                SET username = '$username'
                WHERE userId = '$userId';";

    $result = mysqli_query($conn, $query);

    // error handling for unable to connect to db
    if (!$result) {
        $response["message"] = "Error: failed to change the details of $username.";
        return $response; 
    }

    $response["success"] = true;
    $response["message"] = "Successfully modified the details for $username.";

    // no error, so get the updated data from the database
    $response = handleGetData($conn, $sql_table, $response);

    return $response; 
}

function handlePutData($conn, $sql_table, $response) {
    // get the data that was posted
    $jsonData = file_get_contents('php://input');
    
    // $putUserData: {userId: number, username: string, password: string, dateJoined: string, isAdmin: "0" | "1"}
    $putUserData = json_decode($jsonData, true);

    $userId = sanitise_input($putUserData["userId"]);
    $username = sanitise_input($putUserData["username"]);
    $password = sanitise_input($putUserData["password"]);

    // validate user-inputted data
    if (!validatePassword($password)) {
        $response["message"] = "Error: invalid password. Needs at least 8 characters.";
        return $response; 
    }

    // hash the password
    $hashed_password = password_hash($password, PASSWORD_BCRYPT);    

    // write the sql query
    $query = "  UPDATE Users
                SET password = '$hashed_password'
                WHERE userId = '$userId';";

    $result = mysqli_query($conn, $query);

    // error handling for unable to connect to db
    if (!$result) {
        $response["message"] = "Error: failed to modify the password.";
        return $response; 
    }

    $response["success"] = true;
    $response["message"] = "Successfully changed the password for $username.";

    // no error, so get the updated data from the database
    $response = handleGetData($conn, $sql_table, $response);

    return $response; 
}

function handleDeleteData($conn, $sql_table, $response) {

    // get the user id from query parameters
    $userId = sanitise_input($_GET['userId']);

    // write the sql query
    $query = "DELETE FROM $sql_table
        WHERE
        userId = $userId";

    $result = mysqli_query($conn, $query);

    // error handling for unable to connect to db
    if (!$result) {
        $response["message"] = "Error: failed to delete user.";
        return $response; 
    }

    $response["success"] = true;
    $response["message"] = "Successfully deleted user.";

    // success, so get the updated data
    $response = handleGetData($conn, $sql_table, $response);

    return $response;
}

function checkDuplicate($conn, $sql_table, $username) {
    // check if the user already exists in the database, and return with an error if they do
    $query = "SELECT *
                FROM Users
                WHERE username = '$username';";

    $result = mysqli_query($conn, $query);

    return mysqli_fetch_assoc($result);
}

function validateUsername($username) {
    if (preg_match("/^[a-zA-Z0-9]+$/", $username)) {
        return true;
    }
    return false;
}

function validatePassword($password) {
    if (preg_match("/^.{8,}$/", $password)) {
        return true;
    }
    return false;
}

function validateIsAdmin($isAdmin) {
    if (preg_match("/^[01]$/", $isAdmin)) {
        return true;
    }
    return false;
}

?>