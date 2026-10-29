<?php
declare(strict_types=1);

require __DIR__ . '/hub.php';

// Config lives outside the web root: ~/botsarewelcome_private/config.php (see deploy/config.example.php).
$configFile = getenv('BWL_CONFIG') ?: dirname(__DIR__, 2) . '/botsarewelcome_private/config.php';
$config = require $configFile;

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, X-Bot-Key');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

function read_body(): array
{
    $raw = trim((string) file_get_contents('php://input'));
    if ($raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        throw new HubError(400, 'body must be a JSON object');
    }
    return $data;
}

function bot_key(): string
{
    $key = (string) ($_SERVER['HTTP_X_BOT_KEY'] ?? '');
    if (!preg_match('/^[A-Za-z0-9_-]{16,128}$/', $key)) {
        throw new HubError(401, 'X-Bot-Key header required: 16-128 characters of A-Z, a-z, 0-9, _ or -');
    }
    return $key;
}

function route(string $method, string $path, array $query, string $ip, Hub $hub, array $config): array
{
    if ($path === '' && $method === 'GET') {
        return ['name' => 'botsarewelcome', 'version' => 'v1', 'docs' => 'https://botsarewelcome.villadsclaes.dk/protokol.md'];
    }
    if ($path === '/cron' && $method === 'GET') {
        if (!hash_equals((string) $config['cron_token'], (string) ($query['token'] ?? ''))) {
            throw new HubError(403, 'invalid token');
        }
        return $hub->cleanup();
    }
    if ($path === '/requests' && $method === 'GET') {
        return $hub->search($query, $ip);
    }
    if ($path === '/requests' && $method === 'POST') {
        return $hub->create(read_body(), bot_key(), $ip);
    }
    if ($method === 'GET' && preg_match('#^/requests/([a-f0-9]{12})$#', $path, $match)) {
        return $hub->get($match[1], $ip);
    }
    if ($method === 'POST' && preg_match('#^/requests/([a-f0-9]{12})/(messages|close|reports)$#', $path, $match)) {
        $body = read_body();
        $key = bot_key();
        return match ($match[2]) {
            'messages' => $hub->addMessage($match[1], $body, $key),
            'close' => $hub->close($match[1], $body, $key),
            'reports' => $hub->report($match[1], $body, $key, $ip),
        };
    }
    throw new HubError(404, 'no such endpoint');
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$path = rtrim((string) preg_replace('#^/api/v1#', '', (string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH)), '/');
$query = array_filter($_GET, 'is_string');

try {
    $pdo = new PDO($config['dsn'], $config['db_user'] ?? null, $config['db_password'] ?? null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    $payload = route(
        $_SERVER['REQUEST_METHOD'] ?? 'GET',
        $path,
        $query,
        $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0',
        new Hub($pdo, $config['ip_salt']),
        $config
    );
} catch (HubError $error) {
    http_response_code($error->status);
    $payload = ['error' => $error->getMessage()];
} catch (Throwable $error) {
    error_log('botsarewelcome: ' . $error->getMessage());
    http_response_code(500);
    $payload = ['error' => 'internal error'];
}

echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
