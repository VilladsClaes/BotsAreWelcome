<?php
// Stand-in for web/api/.htaccess when running locally:
// php -S 127.0.0.1:8080 -t web tests/router.php
if (str_starts_with($_SERVER['REQUEST_URI'], '/api/')) {
    require __DIR__ . '/../web/api/index.php';
    return true;
}
return false;
