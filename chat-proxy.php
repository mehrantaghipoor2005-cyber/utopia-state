<?php
define('GROQ_API_KEY', 'gsk_اینجا-کلیدت-را-بگذار');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error'=>'Method not allowed']); exit; }

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['messages'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request']);
    exit;
}

$payload = json_encode([
    'model'      => 'llama-3.1-8b-instant',
    'max_tokens' => 1024,
    'stream'     => false,
    'messages'   => $input['messages']
]);

$result = false;

// روش اول: curl
if (function_exists('curl_init')) {
    $ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . GROQ_API_KEY
        ]
    ]);
    $result   = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr  = curl_error($ch);
    curl_close($ch);

    if ($result === false) {
        echo json_encode(['error' => 'curl error: ' . $curlErr]);
        exit;
    }
    http_response_code($httpCode);
    echo $result;
    exit;
}

// روش دوم: file_get_contents
if (ini_get('allow_url_fopen')) {
    $context = stream_context_create([
        'http' => [
            'method'  => 'POST',
            'header'  => implode("\r\n", [
                'Content-Type: application/json',
                'Authorization: Bearer ' . GROQ_API_KEY
            ]),
            'content' => $payload,
            'timeout' => 30,
            'ignore_errors' => true
        ]
    ]);
    $result = @file_get_contents('https://api.groq.com/openai/v1/chat/completions', false, $context);
    if ($result !== false) {
        echo $result;
        exit;
    }
}

echo json_encode(['error' => 'سرور قادر به اتصال به Groq نیست. لطفاً با پشتیبانی هاست تماس بگیرید.']);
