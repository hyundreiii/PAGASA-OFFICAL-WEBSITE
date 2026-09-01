<?php
/**
 * PAGASA Guimba Youth MIS - REST API & MySQL Backend Bridge
 * Compatible with PHP 7.4+, PHP 8.x, Apache/Nginx, XAMPP, and cPanel
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database configuration
$db_host = 'localhost';
$db_user = 'root';
$db_pass = '';
$db_name = 'pagasa_guimba_mis';

try {
    $pdo = new PDO("mysql:host={$db_host};dbname={$db_name};charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'get_members':
        $stmt = $pdo->query("SELECT * FROM members ORDER BY created_at DESC");
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
        break;

    case 'get_events':
        $stmt = $pdo->query("SELECT * FROM events WHERE is_published = 1 ORDER BY date ASC");
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
        break;

    case 'get_announcements':
        $stmt = $pdo->query("SELECT * FROM announcements WHERE is_published = 1 ORDER BY is_pinned DESC, date DESC");
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
        break;

    case 'get_projects':
        $stmt = $pdo->query("SELECT * FROM projects ORDER BY start_date DESC");
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
        break;

    case 'get_officials':
        $stmt = $pdo->query("SELECT * FROM officials ORDER BY order_priority ASC");
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
        break;

    case 'verify_qr':
        $input = json_decode(file_get_contents('php://input'), true);
        $qrToken = $input['qrCodeToken'] ?? '';
        $stmt = $pdo->prepare("SELECT * FROM members WHERE qr_code_token = ? OR member_id = ?");
        $stmt->execute([$qrToken, $qrToken]);
        $member = $stmt->fetch();
        if ($member) {
            echo json_encode(['success' => true, 'member' => $member]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Member QR token not found.']);
        }
        break;

    default:
        echo json_encode([
            'success' => true,
            'message' => 'PAGASA Guimba Youth MIS MySQL API is running.',
            'endpoints' => [
                '?action=get_members',
                '?action=get_events',
                '?action=get_announcements',
                '?action=get_projects',
                '?action=get_officials',
                '?action=verify_qr (POST)'
            ]
        ]);
        break;
}
