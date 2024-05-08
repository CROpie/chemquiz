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

if ($_SERVER["REQUEST_METHOD"] === "POST") {

    $response = handleLogin($conn, $response);

    header("Content-Type: application/json");
    echo json_encode($response);
    mysqli_close($conn);
}

function handleLogin($conn, $response) {

    // get the data that was posted, and send it to a function to sanitise it
    $fullUsername = sanitise_input($_POST["username"]);
    $password = sanitise_input($_POST["password"]);

    // eg admin@instatute.edu.au -> admin // instatute.edu.au
    $splitUsername = explode("@", $fullUsername);

    $username = $splitUsername[0];
    $domain = $splitUsername[1];

    // get the data for the username entered from the database
    $query = "SELECT *
    FROM Users
    WHERE username = '$username'
    ";

    $result = mysqli_query($conn, $query);

    if (!$result) {
        $response["message"] = "Error connecting to database.";
        return $response;
    }

    // will either be a row if username exists, or null
    $row = mysqli_fetch_assoc($result);

    if (!$row) {
        $response["message"] = "User not found.";
        return $response;
    }

    if ($row["isAdmin"] === "1" && $domain !== "instatute.edu.au") {
        $response["message"] = "Incorrect domain entered for admin.";
        return $response;
    }

    if ($row["isAdmin"] === "0" && $domain !== "student.instatute.edu.au") {
        $response["message"] = "Incorrect domain entered for student.";
        return $response;
    }

    // check if the inputted password, when hashed, matches the hashed password in the database
    if (!password_verify($password, $row["password"])) {
        $response["message"] = "The password you entered is incorrect.";
        return $response;
    }

    // remove password from the retrieved data, since it is getting sent to the client
    unset($row["password"]);
    unset($row["dateJoined"]);

    // successful validation
    $response["success"] = true;
    $response["userData"] = $row;

    return $response;
}

?>