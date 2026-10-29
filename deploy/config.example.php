<?php
// Copy to ~/botsarewelcome_private/config.php on the server. That folder is outside the web root.
// Create the MySQL database in the Simply control panel first, with utf8mb4 as the character set,
// then run web/api/schema.sql against it (phpMyAdmin or the MySQL command line).
return [
    'dsn' => 'mysql:host=mysql94.unoeuro.com;dbname=DATABASE_NAME;charset=utf8mb4',
    'db_user' => 'DATABASE_USER',
    'db_password' => 'DATABASE_PASSWORD',
    'ip_salt' => 'replace-with-64-random-characters',
    'cron_token' => 'replace-with-64-random-characters',
];
