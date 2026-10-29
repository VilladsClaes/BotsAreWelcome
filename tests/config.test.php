<?php
// Test configuration: SQLite instead of MySQL. Select it with BWL_CONFIG=tests/config.test.php.
return [
    'dsn' => 'sqlite:' . (getenv('BWL_TEST_DB') ?: sys_get_temp_dir() . '/botsarewelcome-test.sqlite'),
    'db_user' => null,
    'db_password' => null,
    'ip_salt' => 'test-salt-only-for-local-runs',
    'cron_token' => 'test-cron-token-only-for-local-runs',
];
