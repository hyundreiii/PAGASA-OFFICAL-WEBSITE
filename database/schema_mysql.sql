-- ==========================================================
-- PAGASA GUIMBA YOUTH ORGANIZATION MIS - MySQL Database Schema
-- Compatible with MySQL 5.7+, MySQL 8.0+, MariaDB, and phpMyAdmin
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `pagasa_guimba_mis` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `pagasa_guimba_mis`;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `certificates`;
DROP TABLE IF EXISTS `attendance_records`;
DROP TABLE IF EXISTS `attendance_sessions`;
DROP TABLE IF EXISTS `event_registrations`;
DROP TABLE IF EXISTS `events`;
DROP TABLE IF EXISTS `activities`;
DROP TABLE IF EXISTS `projects`;
DROP TABLE IF EXISTS `announcements`;
DROP TABLE IF EXISTS `gallery`;
DROP TABLE IF EXISTS `officials`;
DROP TABLE IF EXISTS `members`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `organization_settings`;
SET FOREIGN_KEY_CHECKS = 1;

-- --------------------------------------------------------
-- Table: organization_settings
-- --------------------------------------------------------
CREATE TABLE `organization_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `org_name` VARCHAR(255) NOT NULL DEFAULT 'PAGASA GUIMBA YOUTH ORGANIZATION',
  `tagline` VARCHAR(255) DEFAULT 'Kabataan. Pagkakaisa. Pag-asa.',
  `sub_tagline` TEXT,
  `logo_url` TEXT,
  `address` TEXT,
  `municipal_hall` VARCHAR(255),
  `email` VARCHAR(150),
  `phone` VARCHAR(100),
  `facebook_url` VARCHAR(255),
  `instagram_url` VARCHAR(255),
  `youtube_url` VARCHAR(255),
  `registration_auto_approval` TINYINT(1) DEFAULT 0,
  `qr_expiry_minutes` INT DEFAULT 120,
  `late_grace_period_minutes` INT DEFAULT 30,
  `allow_public_event_registration` TINYINT(1) DEFAULT 1,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: users (System Authentication & Role Access)
-- --------------------------------------------------------
CREATE TABLE `users` (
  `id` VARCHAR(64) PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255),
  `role` ENUM('SUPER_ADMIN', 'ADMIN', 'MEMBER', 'GUEST') NOT NULL DEFAULT 'MEMBER',
  `avatar` TEXT,
  `member_id` VARCHAR(64) NULL,
  `barangay` VARCHAR(100) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: members (Master Youth Roster)
-- --------------------------------------------------------
CREATE TABLE `members` (
  `id` VARCHAR(64) PRIMARY KEY,
  `member_id` VARCHAR(64) NOT NULL UNIQUE,
  `full_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `phone` VARCHAR(50),
  `gender` ENUM('Male', 'Female', 'Prefer not to say', 'Other') DEFAULT 'Prefer not to say',
  `birthdate` DATE,
  `barangay` VARCHAR(100) NOT NULL,
  `address` TEXT,
  `education_or_occupation` VARCHAR(200),
  `membership_date` DATE,
  `status` ENUM('Active', 'Pending', 'Inactive', 'Suspended') DEFAULT 'Active',
  `position` VARCHAR(100) DEFAULT 'Youth Member',
  `committee` VARCHAR(100) DEFAULT 'General Youth Volunteer',
  `avatar` TEXT,
  `qr_code_token` VARCHAR(255),
  `events_joined` INT DEFAULT 0,
  `attendance_rate` INT DEFAULT 100,
  `community_hours` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: events
-- --------------------------------------------------------
CREATE TABLE `events` (
  `id` VARCHAR(64) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `category` ENUM('Leadership', 'Community Service', 'Sports & Wellness', 'Culture & Arts', 'Education & Training', 'Environment', 'Youth Assembly', 'General') NOT NULL,
  `description` TEXT,
  `banner_image` TEXT,
  `date` DATE NOT NULL,
  `time` VARCHAR(100),
  `location` VARCHAR(255) NOT NULL,
  `venue` VARCHAR(255),
  `organizer` VARCHAR(150) DEFAULT 'PAGASA Guimba Youth Organization',
  `max_participants` INT DEFAULT 100,
  `current_participants` INT DEFAULT 0,
  `registration_enabled` TINYINT(1) DEFAULT 1,
  `status` ENUM('Upcoming', 'Ongoing', 'Completed', 'Cancelled') DEFAULT 'Upcoming',
  `is_published` TINYINT(1) DEFAULT 1,
  `qr_code_secret` VARCHAR(255),
  `speakers_json` JSON,
  `agenda_json` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: event_registrations
-- --------------------------------------------------------
CREATE TABLE `event_registrations` (
  `id` VARCHAR(64) PRIMARY KEY,
  `event_id` VARCHAR(64) NOT NULL,
  `member_id` VARCHAR(64) NOT NULL,
  `member_name` VARCHAR(150) NOT NULL,
  `member_email` VARCHAR(150),
  `registered_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('Registered', 'Cancelled', 'Attended', 'Waitlisted') DEFAULT 'Registered',
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: attendance_sessions
-- --------------------------------------------------------
CREATE TABLE `attendance_sessions` (
  `id` VARCHAR(64) PRIMARY KEY,
  `event_id` VARCHAR(64) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `session_type` ENUM('Morning In', 'Morning Out', 'Afternoon In', 'Afternoon Out', 'Whole Day In', 'General Assembly') NOT NULL,
  `start_time` VARCHAR(50),
  `end_time` VARCHAR(50),
  `date` DATE NOT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `qr_code_token` VARCHAR(255),
  `total_scans` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: attendance_records
-- --------------------------------------------------------
CREATE TABLE `attendance_records` (
  `id` VARCHAR(64) PRIMARY KEY,
  `session_id` VARCHAR(64) NOT NULL,
  `event_id` VARCHAR(64) NOT NULL,
  `event_title` VARCHAR(255),
  `member_id` VARCHAR(64) NOT NULL,
  `member_name` VARCHAR(150) NOT NULL,
  `member_barangay` VARCHAR(100),
  `check_in_time` VARCHAR(50),
  `date` DATE NOT NULL,
  `status` ENUM('Present', 'Late', 'Excused', 'Absent') DEFAULT 'Present',
  `method` ENUM('QR_SCAN', 'MANUAL', 'SEARCH') DEFAULT 'QR_SCAN',
  `verified_by` VARCHAR(150),
  `remarks` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`session_id`) REFERENCES `attendance_sessions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: projects
-- --------------------------------------------------------
CREATE TABLE `projects` (
  `id` VARCHAR(64) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `category` ENUM('Education', 'Environment', 'Livelihood', 'Health & Sports', 'Governance & Leadership', 'Arts & Culture') NOT NULL,
  `description` TEXT,
  `leader` VARCHAR(150),
  `barangay` VARCHAR(100),
  `status` ENUM('Planning', 'Ongoing', 'Completed', 'Cancelled') DEFAULT 'Ongoing',
  `progress` INT DEFAULT 0,
  `start_date` DATE,
  `target_end_date` DATE,
  `budget` DECIMAL(12,2) DEFAULT 0.00,
  `beneficiaries_count` INT DEFAULT 0,
  `image_url` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: activities
-- --------------------------------------------------------
CREATE TABLE `activities` (
  `id` VARCHAR(64) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100),
  `date` DATE,
  `time` VARCHAR(50),
  `location` VARCHAR(255),
  `leader` VARCHAR(150),
  `description` TEXT,
  `target_participants` INT DEFAULT 50,
  `status` ENUM('Upcoming', 'Ongoing', 'Completed') DEFAULT 'Upcoming',
  `attendance_tracked` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: announcements
-- --------------------------------------------------------
CREATE TABLE `announcements` (
  `id` VARCHAR(64) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `category` ENUM('General', 'Urgent Advisory', 'Event Update', 'Scholarship', 'Community Project', 'Emergency', 'Important Notice') DEFAULT 'General',
  `date` DATE NOT NULL,
  `author` VARCHAR(150),
  `author_role` VARCHAR(100),
  `featured_image` TEXT,
  `summary` TEXT,
  `content` LONGTEXT NOT NULL,
  `is_published` TINYINT(1) DEFAULT 1,
  `is_pinned` TINYINT(1) DEFAULT 0,
  `views` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: certificates
-- --------------------------------------------------------
CREATE TABLE `certificates` (
  `id` VARCHAR(64) PRIMARY KEY,
  `certificate_number` VARCHAR(100) NOT NULL UNIQUE,
  `member_id` VARCHAR(64) NOT NULL,
  `member_name` VARCHAR(150) NOT NULL,
  `event_id` VARCHAR(64),
  `event_or_activity_title` VARCHAR(255) NOT NULL,
  `certificate_type` ENUM('Leadership', 'Participation', 'Excellence', 'Volunteerism', 'Special Recognition', 'Completion', 'Recognition', 'Appreciation') DEFAULT 'Participation',
  `issue_date` DATE NOT NULL,
  `organization` VARCHAR(255) DEFAULT 'PAGASA Guimba Youth Organization',
  `description` TEXT,
  `signatories_json` JSON,
  `qr_verification_url` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: officials
-- --------------------------------------------------------
CREATE TABLE `officials` (
  `id` VARCHAR(64) PRIMARY KEY,
  `full_name` VARCHAR(150) NOT NULL,
  `position` VARCHAR(150) NOT NULL,
  `committee` VARCHAR(150),
  `barangay` VARCHAR(100),
  `term` VARCHAR(50) DEFAULT '2025 - 2028',
  `contact` VARCHAR(100),
  `email` VARCHAR(150),
  `image_url` TEXT,
  `order_priority` INT DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: gallery
-- --------------------------------------------------------
CREATE TABLE `gallery` (
  `id` VARCHAR(64) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `category` ENUM('Events', 'Community Outreach', 'General Assemblies', 'Youth Camps', 'Sports League', 'Leadership Training') NOT NULL,
  `image_url` TEXT NOT NULL,
  `caption` TEXT,
  `date` DATE,
  `barangay` VARCHAR(100),
  `likes` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: audit_logs
-- --------------------------------------------------------
CREATE TABLE `audit_logs` (
  `id` VARCHAR(64) PRIMARY KEY,
  `user_name` VARCHAR(150) NOT NULL,
  `user_role` VARCHAR(50) NOT NULL,
  `action` VARCHAR(255) NOT NULL,
  `module` ENUM('Events', 'Attendance', 'Members', 'Announcements', 'Projects', 'Certificates', 'Settings', 'Gallery', 'Officials', 'Activities') NOT NULL,
  `details` TEXT,
  `timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `ip_address` VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: notifications
-- --------------------------------------------------------
CREATE TABLE `notifications` (
  `id` VARCHAR(64) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('info', 'success', 'warning', 'urgent') DEFAULT 'info',
  `timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `is_read` TINYINT(1) DEFAULT 0,
  `target_role` VARCHAR(50),
  `action_url` VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================================
-- SEED DATA INSERTION
-- ==========================================================

INSERT INTO `organization_settings` (`id`, `org_name`, `tagline`, `sub_tagline`, `logo_url`, `address`, `municipal_hall`, `email`, `phone`, `facebook_url`, `instagram_url`, `youtube_url`, `registration_auto_approval`, `qr_expiry_minutes`, `late_grace_period_minutes`, `allow_public_event_registration`) 
VALUES (1, 'PAGASA GUIMBA YOUTH ORGANIZATION', 'Kabataan. Pagkakaisa. Pag-asa.', 'Empowering Guimba\'s Youth, Building a Better Tomorrow.', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=300&q=80', 'Guimba Youth Center, Municipal Compound, Guimba, Nueva Ecija 3115', 'Guimba Municipal Hall, Nueva Ecija, Philippines', 'pagasa.guimbayouth@gmail.com', '+63 917 554 8920 / (044) 958 1234', 'https://facebook.com/pagasaguimbayouth', 'https://instagram.com/pagasaguimbayouth', 'https://youtube.com/@pagasaguimbayouth', 0, 120, 30, 1);

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `avatar`, `member_id`, `barangay`) VALUES
('usr-001', 'Carl Vincent Ramos', 'superadmin@pagasaguimba.org', '$2y$10$sampleAdminHash', 'SUPER_ADMIN', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', 'PGY-2025-001', 'Saint John District (Poblacion)'),
('usr-002', 'Ma. Cristina Santos', 'admin@pagasaguimba.org', '$2y$10$sampleAdminHash', 'ADMIN', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80', 'PGY-2025-002', 'Santa Veronica District (Poblacion)'),
('usr-003', 'Joshua De Guzman', 'member@pagasaguimba.org', '$2y$10$sampleMemberHash', 'MEMBER', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', 'PGY-2026-003', 'San Roque'),
('usr-004', 'Angela Nicole Reyes', 'angela.reyes@gmail.com', '$2y$10$sampleMemberHash', 'MEMBER', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80', 'PGY-2026-004', 'Bacayao');

INSERT INTO `members` (`id`, `member_id`, `full_name`, `email`, `phone`, `gender`, `birthdate`, `barangay`, `address`, `education_or_occupation`, `membership_date`, `status`, `position`, `committee`, `avatar`, `qr_code_token`, `events_joined`, `attendance_rate`, `community_hours`) VALUES
('mem-001', 'PGY-2025-001', 'Carl Vincent Ramos', 'superadmin@pagasaguimba.org', '0917-123-4567', 'Male', '2001-05-14', 'Saint John District (Poblacion)', 'Zone 2, Saint John, Guimba', 'BS Information Technology - Graduate', '2025-01-10', 'Active', 'President / Super Admin', 'Executive Committee', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', 'QR-PGY-2025-001-TOKEN', 18, 98, 72),
('mem-002', 'PGY-2025-002', 'Ma. Cristina Santos', 'admin@pagasaguimba.org', '0918-234-5678', 'Female', '2002-09-22', 'Santa Veronica District (Poblacion)', 'Poblacion Plaza, Guimba', 'BS Public Administration - Senior', '2025-01-15', 'Active', 'Vice President / Admin', 'Community Outreach', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80', 'QR-PGY-2025-002-TOKEN', 16, 94, 60),
('mem-003', 'PGY-2026-003', 'Joshua De Guzman', 'member@pagasaguimba.org', '0920-345-6789', 'Male', '2004-03-18', 'San Roque', 'Purok 3, San Roque, Guimba', 'BS Agriculture - 2nd Year', '2026-02-01', 'Active', 'Youth Member', 'Environmental Affairs', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', 'QR-PGY-2026-003-TOKEN', 9, 89, 36),
('mem-004', 'PGY-2026-004', 'Angela Nicole Reyes', 'angela.reyes@gmail.com', '0929-456-7890', 'Female', '2005-11-04', 'Bacayao', 'Purok 1, Bacayao, Guimba', 'Grade 12 STEM - Guimba National HS', '2026-02-10', 'Active', 'Youth Member', 'Education & Literacy', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80', 'QR-PGY-2026-004-TOKEN', 7, 100, 28);

INSERT INTO `events` (`id`, `title`, `category`, `description`, `banner_image`, `date`, `time`, `location`, `venue`, `organizer`, `max_participants`, `current_participants`, `registration_enabled`, `status`, `is_published`, `qr_code_secret`, `speakers_json`, `agenda_json`) VALUES
('evt-001', 'PAGASA Guimba Youth Leadership Summit 2026', 'Leadership', 'Annual municipal-wide youth empowerment summit convening youth leaders across all 64 barangays of Guimba.', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80', '2026-09-15', '08:00 AM - 05:00 PM', 'Guimba Municipal Gymnasium', 'Main Multi-Purpose Arena', 'PAGASA Guimba Youth Organization', 350, 142, 1, 'Upcoming', 1, 'SECRET_SUMMIT_2026', '[{"name":"Hon. Municipal Mayor","title":"Keynote Speaker"},{"name":"Youth Council President","title":"Youth Empowerment Speaker"}]', '[{"time":"08:00 AM","title":"Registration & QR Check-in"},{"time":"09:00 AM","title":"Opening Plenary"},{"time":"01:00 PM","title":"Breakout Workshops"},{"time":"04:30 PM","title":"Awarding of Certificates"}]'),
('evt-002', 'Tree Planting & Eco-Camp Guimba 2026', 'Environment', 'Reforestation initiative planting 2,500 indigenous seedlings across Mount Bitas and riverside barangays.', 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1200&q=80', '2026-09-22', '06:00 AM - 12:00 PM', 'Barangay Nagpandayan Watershed Area', 'Eco Reserve Ground', 'PAGASA Guimba & MENRO Guimba', 200, 88, 1, 'Upcoming', 1, 'SECRET_TREECAMP_2026', '[]', '[{"time":"06:00 AM","title":"Assembly at Guimba Municipal Plaza"},{"time":"07:00 AM","title":"Planting Activity"},{"time":"11:00 AM","title":"Boodle Fight & Wrap-up"}]');

INSERT INTO `announcements` (`id`, `title`, `category`, `date`, `author`, `author_role`, `featured_image`, `summary`, `content`, `is_published`, `is_pinned`, `views`) VALUES
('ann-001', 'Registration Open: PAGASA Guimba Youth Leadership Summit 2026', 'Important Notice', '2026-09-01', 'Carl Vincent Ramos', 'President', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=80', 'Calling all SK chairpersons, youth organization officers, and student leaders across Guimba to register for the 2026 Leadership Summit.', 'We are officially opening registrations for our biggest gathering of the year! Participants will receive official certificates of participation, summit kits, and meals. Scan your digital member QR to register instantly.', 1, 1, 1420),
('ann-002', 'Municipal Tree Planting: 2,500 Seedlings Target', 'Community Project', '2026-08-28', 'Ma. Cristina Santos', 'Vice President', 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1000&q=80', 'Join our environmental committee in revitalizing our watershed this September 22.', 'Bring your gardening gloves and reusable water bottles! Transportation will be provided from the Municipal Gymnasium starting at 5:30 AM.', 1, 0, 890);

INSERT INTO `projects` (`id`, `title`, `category`, `description`, `leader`, `barangay`, `status`, `progress`, `start_date`, `target_end_date`, `budget`, `beneficiaries_count`, `image_url`) VALUES
('prj-001', 'Project Dunong: Mobile Library & STEM Hub', 'Education', 'Providing solar-powered digital tablets and curated book collections to remote elementary schools in Guimba.', 'Angela Nicole Reyes', 'All 64 Barangays', 'Ongoing', 75, '2026-03-01', '2026-11-30', 250000.00, 1800, 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80'),
('prj-002', 'Lingap Kalikasan: Barangay Green Zones', 'Environment', 'Establishing community composting hubs and tree nurseries across Guimba barangays.', 'Joshua De Guzman', 'Nagpandayan', 'Ongoing', 60, '2026-04-15', '2026-10-31', 120000.00, 950, 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80');

INSERT INTO `officials` (`id`, `full_name`, `position`, `committee`, `barangay`, `term`, `contact`, `email`, `image_url`, `order_priority`) VALUES
('off-001', 'Carl Vincent Ramos', 'President', 'Executive Committee', 'Saint John District (Poblacion)', '2025 - 2028', '+63 917 123 4567', 'president@pagasaguimba.org', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80', 1),
('off-002', 'Ma. Cristina Santos', 'Vice President', 'Community Affairs', 'Santa Veronica District (Poblacion)', '2025 - 2028', '+63 918 234 5678', 'vp@pagasaguimba.org', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80', 2),
('off-003', 'Ezekiel Bautista', 'Secretary General', 'Secretariat & Records', 'San Roque', '2025 - 2028', '+63 919 345 6789', 'secretary@pagasaguimba.org', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80', 3),
('off-004', 'Danielle Joy Mendoza', 'Treasurer', 'Finance & Logistics', 'Bacayao', '2025 - 2028', '+63 920 456 7890', 'treasurer@pagasaguimba.org', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80', 4);
