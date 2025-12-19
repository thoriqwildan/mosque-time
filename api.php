<?php
error_reporting(0);
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$file = 'data.json';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if ($data !== null) {
        if (file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT), LOCK_EX)) {
            echo json_encode(array("status" => "success", "message" => "Data tersimpan"));
        } else {
            http_response_code(500);
            echo json_encode(array("status" => "error", "message" => "Gagal menulis file"));
        }
    } else {
        http_response_code(400);
        echo json_encode(array("status" => "error", "message" => "JSON Invalid"));
    }
} 
else {
    if (file_exists($file)) {
        header("Cache-Control: no-cache, no-store, must-revalidate");
        echo file_get_contents($file);
    } else {
        $defaultData = array(
            "mosque_name" => "Masjid Belum Disetting",
            "mosque_address" => "Silakan buka admin panel",
            "running_text" => "Selamat Datang...",
            "latitude" => "-6.1754", 
            "longitude" => "106.8272",
            "tune_subuh" => 0, "tune_shuruq" => 0, "tune_dzuhur" => 0,
            "tune_ashar" => 0, "tune_maghrib" => 0, "tune_isya" => 0,
            "countdown_duration" => 10,
            "time_offset" => 0
        );
        file_put_contents($file, json_encode($defaultData, JSON_PRETTY_PRINT), LOCK_EX);
        echo json_encode($defaultData);
    }
}
?>