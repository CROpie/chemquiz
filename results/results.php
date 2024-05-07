<?php

// Check if able to fetch PHP response
// header("Content-Type: application/json");

// $response = array("success" => "Successfully accessed PHP.");

// echo json_encode($response);


require_once ("../settings.php");
$conn = mysqli_connect($host, $user, $pwd, $sql_db);

if (!$conn) {
    $response = array("error" => "Error connecting to the database.");
    echo json_encode($response);
    exit;
}

$userId = $_GET["userId"];

// get the data that was posted
$jsonData = file_get_contents('php://input');

// $playerAnswersData: [{answerType: "structure" | "reaction" | ... , userAnswer: string, questionId: number }, ... ]
$playerAnswersData = json_decode($jsonData, true);


// was thinking that the questions would have to be retrieved here, in order to render them on the next page
// however the questions are actually already stored in sessionStorage...

// questions = sessionStorage.getItem('questions')
// playerAnswers = sessionStorage.getItem('playerAnswers')
// results = [true, false, true, true, false] (send from here)

$playerScore = 0;
$playerResultsArray = array();

for ($i = 0; $i < count($playerAnswersData); $i++) {

    $type = $playerAnswersData[$i]["answerType"];
    $playerAnswer = $playerAnswersData[$i]["userAnswer"];
    $questionId = $playerAnswersData[$i]["questionId"];

    $query = '';

    if ($type === "structure") {
        $query = "SELECT answer
        FROM StructureQ
        WHERE structureId = $questionId
    ";
    } else if ($type === "reaction") {
        $query = "SELECT productInchi
        FROM ReactionQ
        WHERE reactionId = $questionId
        ";
    }

    $result = mysqli_query($conn, $query);

    $row = mysqli_fetch_assoc($result);

    $actualAnswer = '';

    if ($type === "structure") {
        $actualAnswer = $row["answer"];
    } else if ($type === "reaction") {
        $actualAnswer = $row["productInchi"];
    }
    
    if ($playerAnswer === $actualAnswer) {
        $playerScore += 1;
        $playerResultsArray[] = true;
    } else {
        $playerResultsArray[] = false;
    }
    mysqli_free_result($result);
}

// store the score on the database

$query2="INSERT INTO Scores(userId,score)
        VALUES($userId,$playerScore);";

$result2=mysqli_query($conn,$query2);



// get updated score data leaderboard attempt times and highest score



// $query3="SELECT userId, username, max(score) as topScore
// FROM Users
// WHERE Users.userId='$userId'
// JOIN Scores ON Users.userId=Scores.userId
// GROUP BY Scores.userId 
// ORDER BY topScore";

$query3="SELECT Users.userId, Users.username, Scores.attemptDate, max(Scores.score) AS topScore
FROM Users
JOIN Scores ON Users.userId=Scores.userId
WHERE Users.userId=$userId
GROUP BY Users.userId, Users.username
ORDER BY topScore;";

$query4="SELECT count(*)
FROM Scores
WHERE Scores.userId='$userId'";

$query5="SELECT score, attemptDate
FROM Scores 
WHERE Scores.UserId='$userId'
ORDER BY score DESC
LIMIT 5;";

$result3=mysqli_query($conn,$query3);

$result4=mysqli_query($conn,$query4);

$result5=mysqli_query($conn,$query5);

$leaderBoard=array();
$highestScores=array();

while ($row = mysqli_fetch_assoc($result3)) {
    $leaderBoard[]=$row;
}

$row = mysqli_fetch_assoc($result4);

$attemptCount = $row["count(*)"];

while($row=mysqli_fetch_assoc($result5)) {
    $highestScores[]=$row;
}

mysqli_free_result($result3);
mysqli_free_result($result4);
mysqli_free_result($result5);

// prepare an object that will be sent back to client
$response = array(
    "success" => true,
    "message" => "",
    "score" => $playerScore,
    "userId" => $userId,
    "results" => $playerResultsArray,
    "leaderBoard"=>$leaderBoard,
    "attemptCount"=>$attemptCount,
    "highestScores"=>$highestScores

);

header("Content-Type: application/json");
echo json_encode($response);

mysqli_close($conn);

?>
