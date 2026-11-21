-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: urbanmate
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `addresses`
--

DROP TABLE IF EXISTS `addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `addresses` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `label` varchar(60) NOT NULL,
  `line1` varchar(255) NOT NULL,
  `line2` varchar(255) DEFAULT NULL,
  `city` varchar(100) NOT NULL,
  `region` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) NOT NULL,
  `country_code` varchar(2) NOT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `city_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `area_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `addresses_user_id` (`user_id`),
  KEY `addresses_area_id_foreign_idx` (`area_id`),
  KEY `addresses_city_id_area_id` (`city_id`,`area_id`),
  CONSTRAINT `addresses_area_id_foreign_idx` FOREIGN KEY (`area_id`) REFERENCES `areas` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `addresses_city_id_foreign_idx` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `addresses`
--

LOCK TABLES `addresses` WRITE;
/*!40000 ALTER TABLE `addresses` DISABLE KEYS */;
INSERT INTO `addresses` VALUES ('82b285a8-1bf3-4462-8893-973f797e6c74','d41d50cb-f792-4a0e-8346-63ee4b5b909b','Home','123 Market St','Apt 4B','New York',NULL,'10001','US',NULL,NULL,1,'2026-11-19 08:17:27','2026-11-19 08:17:27',NULL,NULL),('fa8d8bef-d91f-4fe2-8446-e19987b10931','d41d50cb-f792-4a0e-8346-63ee4b5b909b','Office','Sql coWorkspace','Noida','NOIDA',NULL,'201301','IN',NULL,NULL,1,'2026-11-19 06:54:02','2026-11-19 12:29:42',NULL,NULL);
/*!40000 ALTER TABLE `addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `areas`
--

DROP TABLE IF EXISTS `areas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `areas` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `city_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(120) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `areas_city_slug_unique` (`city_id`,`slug`),
  KEY `areas_city_id_is_active` (`city_id`,`is_active`),
  CONSTRAINT `areas_ibfk_1` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `areas`
--

LOCK TABLES `areas` WRITE;
/*!40000 ALTER TABLE `areas` DISABLE KEYS */;
/*!40000 ALTER TABLE `areas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `booking_service_items`
--

DROP TABLE IF EXISTS `booking_service_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `booking_service_items` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `booking_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `item_type` enum('package','addon') NOT NULL,
  `service_package_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `service_addon_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `name_snapshot` varchar(120) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `duration_minutes` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `booking_service_items_booking_id` (`booking_id`),
  KEY `booking_service_items_service_package_id` (`service_package_id`),
  KEY `booking_service_items_service_addon_id` (`service_addon_id`),
  CONSTRAINT `booking_service_items_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `booking_service_items_ibfk_2` FOREIGN KEY (`service_package_id`) REFERENCES `service_packages` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `booking_service_items_ibfk_3` FOREIGN KEY (`service_addon_id`) REFERENCES `service_addons` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `booking_service_items`
--

LOCK TABLES `booking_service_items` WRITE;
/*!40000 ALTER TABLE `booking_service_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `booking_service_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `booking_status_history`
--

DROP TABLE IF EXISTS `booking_status_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `booking_status_history` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `booking_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `actor_user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `from_status` varchar(32) DEFAULT NULL,
  `to_status` varchar(32) NOT NULL,
  `reason` varchar(500) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `actor_user_id` (`actor_user_id`),
  KEY `booking_status_history_booking_id_created_at` (`booking_id`,`created_at`),
  CONSTRAINT `booking_status_history_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `booking_status_history_ibfk_2` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `booking_status_history`
--

LOCK TABLES `booking_status_history` WRITE;
/*!40000 ALTER TABLE `booking_status_history` DISABLE KEYS */;
INSERT INTO `booking_status_history` VALUES ('0485aed8-4c18-4fda-95ca-8d49cd508636','c5557454-2385-4bfd-9d96-3810c2f517ae','d41d50cb-f792-4a0e-8346-63ee4b5b909b',NULL,'assigned',NULL,NULL,'2026-11-19 11:29:22','2026-11-19 11:29:22'),('08a113ee-cd46-4c47-bfbf-fa46ea96870b','c5557454-2385-4bfd-9d96-3810c2f517ae','ffd5bfe2-80f3-4d1c-b099-0ec7ddee7394','assigned','assigned','Assigned by administrator',NULL,'2026-11-19 12:57:39','2026-11-19 12:57:39'),('14436289-fce0-4697-ad6e-b2f90e037359','a41534ba-a880-4580-8d69-b9c83496e9f9','d41d50cb-f792-4a0e-8346-63ee4b5b909b',NULL,'assigned',NULL,NULL,'2026-11-19 11:27:41','2026-11-19 11:27:41'),('3e95d849-d060-40eb-92b4-a6d7882b6c6c','a81061a7-f454-4345-af1b-c520cff29fe7','d41d50cb-f792-4a0e-8346-63ee4b5b909b','confirmed','cancelled','Cancelled by customer',NULL,'2026-11-19 08:59:15','2026-11-19 08:59:15'),('444cfd45-7724-4959-88a0-06ce3c4c98d9','08d01373-cb08-4df7-a8aa-9c8c38e9ecd8','250c8039-0b58-4853-9d73-b451fe5b38ee','in_progress','provider_completed',NULL,NULL,'2026-11-19 12:45:04','2026-11-19 12:45:04'),('522cff61-0e71-4ac2-9c73-5b89e61e46e2','08d01373-cb08-4df7-a8aa-9c8c38e9ecd8','d41d50cb-f792-4a0e-8346-63ee4b5b909b','provider_completed','completed',NULL,NULL,'2026-11-19 12:56:16','2026-11-19 12:56:16'),('80439c60-35af-4054-ab47-c49869891c3f','c5557454-2385-4bfd-9d96-3810c2f517ae','ffd5bfe2-80f3-4d1c-b099-0ec7ddee7394','assigned','assigned','Assigned by administrator',NULL,'2026-11-19 12:57:38','2026-11-19 12:57:38'),('948382f6-e8be-422f-8f06-a4e9ba8aac68','08d01373-cb08-4df7-a8aa-9c8c38e9ecd8','250c8039-0b58-4853-9d73-b451fe5b38ee','confirmed','in_progress',NULL,NULL,'2026-11-19 12:44:58','2026-11-19 12:44:58'),('9c58dfde-a6fc-4915-828b-531393ad230e','a41534ba-a880-4580-8d69-b9c83496e9f9','d41d50cb-f792-4a0e-8346-63ee4b5b909b','assigned','cancelled','Cancelled by customer',NULL,'2026-11-19 11:29:04','2026-11-19 11:29:04'),('9df5c86a-fd2a-4ad4-bd62-ca7a86feac19','08d01373-cb08-4df7-a8aa-9c8c38e9ecd8','d41d50cb-f792-4a0e-8346-63ee4b5b909b',NULL,'assigned',NULL,NULL,'2026-11-19 12:44:44','2026-11-19 12:44:44'),('da2d0a07-6d24-4119-ba65-c8f0bfc18aea','9b9fcb33-f331-422c-9cea-ec359eac50e2','d41d50cb-f792-4a0e-8346-63ee4b5b909b','pending','cancelled','Cancelled by customer',NULL,'2026-11-19 08:59:16','2026-11-19 08:59:16'),('ece2a04b-63a6-4b80-9c3f-795d277cc19d','c5557454-2385-4bfd-9d96-3810c2f517ae','ffd5bfe2-80f3-4d1c-b099-0ec7ddee7394','assigned','assigned','Assigned by administrator',NULL,'2026-11-19 12:57:40','2026-11-19 12:57:40'),('f12dbdbd-f212-4562-9b2c-a2e1f0ed057d','08d01373-cb08-4df7-a8aa-9c8c38e9ecd8','250c8039-0b58-4853-9d73-b451fe5b38ee','assigned','confirmed',NULL,NULL,'2026-11-19 12:44:51','2026-11-19 12:44:51');
/*!40000 ALTER TABLE `booking_status_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bookings` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `booking_number` varchar(32) NOT NULL,
  `customer_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `provider_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `service_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `address_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `service_name_snapshot` varchar(140) NOT NULL,
  `scheduled_start` datetime NOT NULL,
  `scheduled_end` datetime NOT NULL,
  `status` enum('pending','assigned','confirmed','in_progress','provider_completed','completed','cancelled','rejected') NOT NULL DEFAULT 'pending',
  `subtotal` decimal(10,2) NOT NULL,
  `platform_fee` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL,
  `currency` varchar(3) NOT NULL,
  `customer_notes` text DEFAULT NULL,
  `cancellation_reason` varchar(500) DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `booking_number` (`booking_number`),
  KEY `bookings_customer_id_created_at` (`customer_id`,`created_at`),
  KEY `bookings_provider_id_scheduled_start_status` (`provider_id`,`scheduled_start`,`status`),
  KEY `bookings_status_scheduled_start` (`status`,`scheduled_start`),
  KEY `bookings_service_id` (`service_id`),
  KEY `bookings_address_id` (`address_id`),
  CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `bookings_ibfk_3` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `bookings_ibfk_4` FOREIGN KEY (`address_id`) REFERENCES `addresses` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES ('08d01373-cb08-4df7-a8aa-9c8c38e9ecd8','UM-7F233F1A40DC47DA8E47','d41d50cb-f792-4a0e-8346-63ee4b5b909b','d57d5638-64e4-4b66-ade2-bb6c8028fb27','30000000-0000-4000-8000-000000000003','82b285a8-1bf3-4462-8893-973f797e6c74','Electrical inspection','2026-11-20 04:30:00','2026-11-20 05:30:00','completed',69.00,0.00,0.00,69.00,'INR',NULL,NULL,'2026-11-19 12:56:16','2026-11-19 12:44:44','2026-11-19 12:56:16'),('774ed35a-4963-470b-9963-e5d9b40e0210','UB-247641-1','d41d50cb-f792-4a0e-8346-63ee4b5b909b','332a1c15-005b-4f0b-90e2-56cb8cae8312','30000000-0000-4000-8000-000000000001','82b285a8-1bf3-4462-8893-973f797e6c74','Standard home cleaning','2026-11-18 08:17:27','2026-11-18 10:17:27','completed',49.00,4.90,0.00,49.00,'INR','Please ring the doorbell on arrival',NULL,'2026-11-18 08:17:27','2026-11-18 08:17:27','2026-11-18 08:17:27'),('9b9fcb33-f331-422c-9cea-ec359eac50e2','UB-247641-3','d41d50cb-f792-4a0e-8346-63ee4b5b909b',NULL,'30000000-0000-4000-8000-000000000003','82b285a8-1bf3-4462-8893-973f797e6c74','Electrical inspection','2026-11-21 08:17:27','2026-11-21 10:17:27','cancelled',69.00,6.00,0.00,69.00,'INR','Awaiting provider confirmation','Cancelled by customer',NULL,'2026-11-19 08:17:27','2026-11-19 08:59:16'),('a41534ba-a880-4580-8d69-b9c83496e9f9','UM-2012C8F98159400B8943','d41d50cb-f792-4a0e-8346-63ee4b5b909b','d57d5638-64e4-4b66-ade2-bb6c8028fb27','30000000-0000-4000-8000-000000000105','82b285a8-1bf3-4462-8893-973f797e6c74','Furnished apartment - Home deep cleaning','2026-11-20 04:30:00','2026-11-20 08:15:00','cancelled',3499.00,0.00,0.00,3499.00,'INR',NULL,'Cancelled by customer',NULL,'2026-11-19 11:27:41','2026-11-19 11:29:04'),('a81061a7-f454-4345-af1b-c520cff29fe7','UB-247641-2','d41d50cb-f792-4a0e-8346-63ee4b5b909b','332a1c15-005b-4f0b-90e2-56cb8cae8312','30000000-0000-4000-8000-000000000002','82b285a8-1bf3-4462-8893-973f797e6c74','Plumbing repair','2026-11-20 08:17:27','2026-11-20 10:17:27','cancelled',59.00,5.00,0.00,59.00,'INR','Kitchen sink pipe repair','Cancelled by customer',NULL,'2026-11-19 08:17:27','2026-11-19 08:59:15'),('c5557454-2385-4bfd-9d96-3810c2f517ae','UM-5266B89BFE9B4326B041','d41d50cb-f792-4a0e-8346-63ee4b5b909b','bf903e7e-7a7b-4fcb-897e-bcbfae745554','30000000-0000-4000-8000-000000000012','82b285a8-1bf3-4462-8893-973f797e6c74','Acoustic fluted wood panel accent wall','2026-11-20 04:30:00','2026-11-20 10:30:00','assigned',249.00,0.00,0.00,249.00,'INR',NULL,NULL,NULL,'2026-11-19 11:29:22','2026-11-19 12:57:38');
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cities`
--

DROP TABLE IF EXISTS `cities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cities` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(120) NOT NULL,
  `country_code` varchar(2) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `cities_country_code_is_active` (`country_code`,`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cities`
--

LOCK TABLES `cities` WRITE;
/*!40000 ALTER TABLE `cities` DISABLE KEYS */;
/*!40000 ALTER TABLE `cities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `commissions`
--

DROP TABLE IF EXISTS `commissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `commissions` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `booking_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `provider_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `rate_percent` decimal(5,2) NOT NULL,
  `status` enum('pending','payable','paid','reversed') NOT NULL DEFAULT 'pending',
  `currency` varchar(3) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `booking_id` (`booking_id`),
  KEY `commissions_provider_id_status` (`provider_id`,`status`),
  CONSTRAINT `commissions_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `commissions_ibfk_2` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commissions`
--

LOCK TABLES `commissions` WRITE;
/*!40000 ALTER TABLE `commissions` DISABLE KEYS */;
INSERT INTO `commissions` VALUES ('6c1bcccc-8a19-4b87-bb18-e20c1a98e856','a41534ba-a880-4580-8d69-b9c83496e9f9','d57d5638-64e4-4b66-ade2-bb6c8028fb27',3499.00,0.00,'reversed','INR','2026-11-19 13:11:31','2026-11-19 13:11:31'),('7f0892a3-7cb8-4728-85e1-2d453e67d8f0','08d01373-cb08-4df7-a8aa-9c8c38e9ecd8','d57d5638-64e4-4b66-ade2-bb6c8028fb27',69.00,0.00,'payable','INR','2026-11-19 13:11:31','2026-11-19 13:11:31');
/*!40000 ALTER TABLE `commissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `booking_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `type` varchar(60) NOT NULL,
  `message` varchar(500) NOT NULL,
  `read_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_user_id_created_at` (`user_id`,`created_at`),
  KEY `notifications_booking_id` (`booking_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES ('0f75379e-0c58-431a-a42f-6394d4948c46','d41d50cb-f792-4a0e-8346-63ee4b5b909b','a41534ba-a880-4580-8d69-b9c83496e9f9','booking_cancelled','The booking has been cancelled.',NULL,'2026-11-19 11:29:04','2026-11-19 11:29:04'),('1e4c4b88-d297-45be-b703-f3f265a50a70','d41d50cb-f792-4a0e-8346-63ee4b5b909b','c5557454-2385-4bfd-9d96-3810c2f517ae','booking_assigned','A service booking has been assigned and is awaiting provider confirmation.',NULL,'2026-11-19 12:57:39','2026-11-19 12:57:39'),('3873f247-b69e-4a1e-81e1-33636319ad2d','d41d50cb-f792-4a0e-8346-63ee4b5b909b','c5557454-2385-4bfd-9d96-3810c2f517ae','booking_assigned','A service booking has been assigned and is awaiting provider confirmation.',NULL,'2026-11-19 12:57:38','2026-11-19 12:57:38'),('3a647427-82ba-4e1e-87e6-0433eb0d7dc5','d41d50cb-f792-4a0e-8346-63ee4b5b909b','08d01373-cb08-4df7-a8aa-9c8c38e9ecd8','booking_confirmed','Your provider accepted the booking.',NULL,'2026-11-19 12:44:51','2026-11-19 12:44:51'),('3b173c18-7cf1-4401-a915-975f43222a56','d41d50cb-f792-4a0e-8346-63ee4b5b909b','c5557454-2385-4bfd-9d96-3810c2f517ae','booking_assigned','A service booking has been assigned and is awaiting provider confirmation.',NULL,'2026-11-19 11:29:22','2026-11-19 11:29:22'),('4275aaf5-c0b7-46ba-b429-e2493ae0cea2','b769ee4b-5f63-4e78-b0c1-af64ab8fd0ba','c5557454-2385-4bfd-9d96-3810c2f517ae','booking_assigned','A service booking has been assigned and is awaiting provider confirmation.',NULL,'2026-11-19 12:57:38','2026-11-19 12:57:38'),('4b96427e-f0ca-45bd-a8c4-1612ba1ebf45','2dd33377-64d5-40ba-a205-ea8c51b784ef','c5557454-2385-4bfd-9d96-3810c2f517ae','booking_assigned','A service booking has been assigned and is awaiting provider confirmation.',NULL,'2026-11-19 11:29:22','2026-11-19 11:29:22'),('4ba218fc-ccda-4962-923f-31f83bf2d9b7','d41d50cb-f792-4a0e-8346-63ee4b5b909b','08d01373-cb08-4df7-a8aa-9c8c38e9ecd8','booking_assigned','A service booking has been assigned and is awaiting provider confirmation.',NULL,'2026-11-19 12:44:44','2026-11-19 12:44:44'),('590cb4cf-ec1e-4cfa-8790-d2bd0ac5c405','d41d50cb-f792-4a0e-8346-63ee4b5b909b','a81061a7-f454-4345-af1b-c520cff29fe7','booking_cancelled','The booking has been cancelled.',NULL,'2026-11-19 08:59:15','2026-11-19 08:59:15'),('5c297c77-07bb-4ecf-a492-e986a13b3e19','b769ee4b-5f63-4e78-b0c1-af64ab8fd0ba','c5557454-2385-4bfd-9d96-3810c2f517ae','booking_assigned','A service booking has been assigned and is awaiting provider confirmation.',NULL,'2026-11-19 12:57:39','2026-11-19 12:57:39'),('77ead57d-823d-429d-b490-ee0fb1c4250e','12d19aa5-638f-4d19-950a-f6e303ce8068','a81061a7-f454-4345-af1b-c520cff29fe7','booking_cancelled','The booking has been cancelled.',NULL,'2026-11-19 08:59:15','2026-11-19 08:59:15'),('83648499-ecb8-4e20-926a-d37e9045a496','d41d50cb-f792-4a0e-8346-63ee4b5b909b','c5557454-2385-4bfd-9d96-3810c2f517ae','booking_assigned','A service booking has been assigned and is awaiting provider confirmation.',NULL,'2026-11-19 12:57:40','2026-11-19 12:57:40'),('8377cfb6-4d96-4d89-9ad9-d24551d62b74','d41d50cb-f792-4a0e-8346-63ee4b5b909b','9b9fcb33-f331-422c-9cea-ec359eac50e2','booking_cancelled','The booking has been cancelled.',NULL,'2026-11-19 08:59:16','2026-11-19 08:59:16'),('af64b485-1265-48f9-899c-d135ed2338b0','250c8039-0b58-4853-9d73-b451fe5b38ee','08d01373-cb08-4df7-a8aa-9c8c38e9ecd8','booking_completed','The customer confirmed the service completion.',NULL,'2026-11-19 12:56:16','2026-11-19 12:56:16'),('c45834d5-a7e7-43cc-a013-4ab66851ebb7','250c8039-0b58-4853-9d73-b451fe5b38ee','08d01373-cb08-4df7-a8aa-9c8c38e9ecd8','booking_assigned','A service booking has been assigned and is awaiting provider confirmation.',NULL,'2026-11-19 12:44:44','2026-11-19 12:44:44'),('c4c06657-fb38-47e5-9eae-41ebc6cf8bef','b769ee4b-5f63-4e78-b0c1-af64ab8fd0ba','c5557454-2385-4bfd-9d96-3810c2f517ae','booking_assigned','A service booking has been assigned and is awaiting provider confirmation.',NULL,'2026-11-19 12:57:40','2026-11-19 12:57:40'),('cbb33c70-3483-4fdb-b50d-9f49f1ce5f5e','d41d50cb-f792-4a0e-8346-63ee4b5b909b','08d01373-cb08-4df7-a8aa-9c8c38e9ecd8','provider_completed','Your provider marked the service complete. Please confirm completion.',NULL,'2026-11-19 12:45:04','2026-11-19 12:45:04'),('dced340a-468d-4605-b815-dc400620820a','250c8039-0b58-4853-9d73-b451fe5b38ee','a41534ba-a880-4580-8d69-b9c83496e9f9','booking_cancelled','The booking has been cancelled.',NULL,'2026-11-19 11:29:04','2026-11-19 11:29:04'),('e842b152-e67b-4a2a-9b3e-8436daf720a2','d41d50cb-f792-4a0e-8346-63ee4b5b909b','08d01373-cb08-4df7-a8aa-9c8c38e9ecd8','booking_started','Your provider has started the service.',NULL,'2026-11-19 12:44:58','2026-11-19 12:44:58'),('ed81ba53-f50e-4960-8927-6ce651ac4b16','250c8039-0b58-4853-9d73-b451fe5b38ee','a41534ba-a880-4580-8d69-b9c83496e9f9','booking_assigned','A service booking has been assigned and is awaiting provider confirmation.',NULL,'2026-11-19 11:27:41','2026-11-19 11:27:41'),('fa051a72-0525-4dd4-8400-7cd8661e0a74','d41d50cb-f792-4a0e-8346-63ee4b5b909b','a41534ba-a880-4580-8d69-b9c83496e9f9','booking_assigned','A service booking has been assigned and is awaiting provider confirmation.',NULL,'2026-11-19 11:27:41','2026-11-19 11:27:41');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otp_verifications`
--

DROP TABLE IF EXISTS `otp_verifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `otp_verifications` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `purpose` varchar(40) NOT NULL,
  `target` varchar(254) NOT NULL,
  `code_hash` varchar(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `verified_at` datetime DEFAULT NULL,
  `attempts` tinyint(3) unsigned NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `otp_verifications_user_id_purpose_verified_at` (`user_id`,`purpose`,`verified_at`),
  KEY `otp_verifications_expires_at` (`expires_at`),
  CONSTRAINT `otp_verifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otp_verifications`
--

LOCK TABLES `otp_verifications` WRITE;
/*!40000 ALTER TABLE `otp_verifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `otp_verifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_reset_tokens` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `token_hash` varchar(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_by_ip` varchar(45) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `password_reset_tokens_user_id_used_at` (`user_id`,`used_at`),
  KEY `password_reset_tokens_expires_at` (`expires_at`),
  CONSTRAINT `password_reset_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payments` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `booking_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `provider_name` varchar(60) NOT NULL,
  `provider_transaction_id` varchar(160) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(3) NOT NULL,
  `status` enum('pending','authorized','captured','failed','refunded','partially_refunded') NOT NULL DEFAULT 'pending',
  `method` varchar(40) DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `provider_transaction_id` (`provider_transaction_id`),
  KEY `payments_booking_id_status` (`booking_id`,`status`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `provider_areas`
--

DROP TABLE IF EXISTS `provider_areas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `provider_areas` (
  `provider_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `area_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`provider_id`,`area_id`),
  KEY `provider_areas_area_id_is_active` (`area_id`,`is_active`),
  CONSTRAINT `provider_areas_ibfk_1` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `provider_areas_ibfk_2` FOREIGN KEY (`area_id`) REFERENCES `areas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `provider_areas`
--

LOCK TABLES `provider_areas` WRITE;
/*!40000 ALTER TABLE `provider_areas` DISABLE KEYS */;
/*!40000 ALTER TABLE `provider_areas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `provider_availabilities`
--

DROP TABLE IF EXISTS `provider_availabilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `provider_availabilities` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `provider_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `weekday` tinyint(3) unsigned NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `is_available` tinyint(1) NOT NULL DEFAULT 1,
  `effective_from` date DEFAULT NULL,
  `effective_until` date DEFAULT NULL,
  `timezone` varchar(64) NOT NULL DEFAULT 'UTC',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `provider_availabilities_provider_id_weekday_is_available` (`provider_id`,`weekday`,`is_available`),
  CONSTRAINT `provider_availabilities_ibfk_1` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `provider_availabilities`
--

LOCK TABLES `provider_availabilities` WRITE;
/*!40000 ALTER TABLE `provider_availabilities` DISABLE KEYS */;
INSERT INTO `provider_availabilities` VALUES ('03a61958-4dbf-4d40-a80f-d37513d0bef3','bf903e7e-7a7b-4fcb-897e-bcbfae745554',0,'06:00:00','23:00:00',1,NULL,NULL,'Asia/Kolkata','2026-11-19 09:37:28','2026-11-19 09:37:28'),('0b9e8e24-497e-4c5e-b793-5ee0681e60b9','d57d5638-64e4-4b66-ade2-bb6c8028fb27',2,'06:00:00','23:00:00',1,NULL,NULL,'Asia/Kolkata','2026-11-19 09:37:28','2026-11-19 09:37:28'),('1359521d-7a42-45fa-9c40-1bbe4aa4cc40','bf903e7e-7a7b-4fcb-897e-bcbfae745554',1,'06:00:00','23:00:00',1,NULL,NULL,'Asia/Kolkata','2026-11-19 09:37:28','2026-11-19 09:37:28'),('1a765dbe-41d5-4c19-9abd-f973d473d652','dad753b4-225e-41b6-a890-651ad82a0019',4,'06:00:00','23:00:00',1,NULL,NULL,'Asia/Kolkata','2026-11-19 09:37:28','2026-11-19 09:37:28'),('2b7fd027-817c-4680-8c3a-bcefdcf3e191','332a1c15-005b-4f0b-90e2-56cb8cae8312',4,'06:00:00','23:00:00',1,NULL,NULL,'Asia/Kolkata','2026-11-19 09:37:28','2026-11-19 09:37:28'),('345c4659-a2eb-45ec-8396-f3a0353b9fda','bf903e7e-7a7b-4fcb-897e-bcbfae745554',4,'06:00:00','23:00:00',1,NULL,NULL,'Asia/Kolkata','2026-11-19 09:37:28','2026-11-19 09:37:28'),('34754506-6b0b-423a-a6fd-67b6af053a8f','d57d5638-64e4-4b66-ade2-bb6c8028fb27',6,'06:00:00','23:00:00',1,NULL,NULL,'Asia/Kolkata','2026-11-19 09:37:28','2026-11-19 09:37:28'),('36c79a98-b9d9-4e59-8f8b-039b08b3a628','dad753b4-225e-41b6-a890-651ad82a0019',3,'06:00:00','23:00:00',1,NULL,NULL,'Asia/Kolkata','2026-11-19 09:37:28','2026-11-19 09:37:28'),('3875abc9-987d-443a-96f8-21524d76b39f','d57d5638-64e4-4b66-ade2-bb6c8028fb27',5,'06:00:00','23:00:00',1,NULL,NULL,'Asia/Kolkata','2026-11-19 09:37:28','2026-11-19 09:37:28'),('4ef9c206-7407-4078-ba50-549a80a4ca89','d57d5638-64e4-4b66-ade2-bb6c8028fb27',3,'06:00:00','23:00:00',1,NULL,NULL,'Asia/Kolkata','2026-11-19 09:37:28','2026-11-19 09:37:28'),('619752c2-8f9f-40c1-83a3-05cf45d6adfd','d57d5638-64e4-4b66-ade2-bb6c8028fb27',1,'09:00:00','17:00:00',1,NULL,NULL,'Asia/Kolkata','2026-11-19 06:46:33','2026-11-19 06:46:33'),('629466a1-ae79-4692-9bf7-f3c2151fe278','d57d5638-64e4-4b66-ade2-bb6c8028fb27',4,'06:00:00','23:00:00',1,NULL,NULL,'Asia/Kolkata','2026-11-19 09:37:28','2026-11-19 09:37:28'),('6b56e5d6-7d92-4140-a240-18be5e0734ad','dad753b4-225e-41b6-a890-651ad82a0019',2,'06:00:00','23:00:00',1,NULL,NULL,'Asia/Kolkata','2026-11-19 09:37:28','2026-11-19 09:37:28'),('6c465be6-c280-4d6b-b6fe-9b14ac4820b6','332a1c15-005b-4f0b-90e2-56cb8cae8312',3,'06:00:00','23:00:00',1,NULL,NULL,'Asia/Kolkata','2026-11-19 09:37:28','2026-11-19 09:37:28'),('73ae6a97-7754-402c-beb7-1879874f8596','d57d5638-64e4-4b66-ade2-bb6c8028fb27',0,'06:00:00','23:00:00',1,NULL,NULL,'Asia/Kolkata','2026-11-19 09:37:28','2026-11-19 09:37:28'),('873886c0-47ea-47f3-8565-a39a6c14f5c4','dad753b4-225e-41b6-a890-651ad82a0019',6,'06:00:00','23:00:00',1,NULL,NULL,'Asia/Kolkata','2026-11-19 09:37:28','2026-11-19 09:37:28'),('8e795440-50f2-47e3-a5b5-4588ed232107','332a1c15-005b-4f0b-90e2-56cb8cae8312',6,'06:00:00','23:00:00',1,NULL,NULL,'Asia/Kolkata','2026-11-19 09:37:28','2026-11-19 09:37:28'),('9841f8d7-779a-4b23-85d9-5438924da88e','bf903e7e-7a7b-4fcb-897e-bcbfae745554',5,'06:00:00','23:00:00',1,NULL,NULL,'Asia/Kolkata','2026-11-19 09:37:28','2026-11-19 09:37:28'),('9b86f131-64af-4e72-ad25-c8498453020b','332a1c15-005b-4f0b-90e2-56cb8cae8312',5,'06:00:00','23:00:00',1,NULL,NULL,'Asia/Kolkata','2026-11-19 09:37:28','2026-11-19 09:37:28'),('9f84479d-45ed-4f0a-a54c-b711a5c8cb1f','332a1c15-005b-4f0b-90e2-56cb8cae8312',0,'06:00:00','23:00:00',1,NULL,NULL,'Asia/Kolkata','2026-11-19 09:37:28','2026-11-19 09:37:28'),('a410305f-8801-4786-9ab6-0d6639ab52a5','dad753b4-225e-41b6-a890-651ad82a0019',1,'06:00:00','23:00:00',1,NULL,NULL,'Asia/Kolkata','2026-11-19 09:37:28','2026-11-19 09:37:28'),('a666b4b9-4688-4781-9ca8-d1d6faa257ab','bf903e7e-7a7b-4fcb-897e-bcbfae745554',3,'06:00:00','23:00:00',1,NULL,NULL,'Asia/Kolkata','2026-11-19 09:37:28','2026-11-19 09:37:28'),('b156f02c-bb86-4962-9d46-bc5e9164efe8','dad753b4-225e-41b6-a890-651ad82a0019',0,'06:00:00','23:00:00',1,NULL,NULL,'Asia/Kolkata','2026-11-19 09:37:28','2026-11-19 09:37:28'),('c12529ec-765c-4a2f-a369-4643ad7ac659','bf903e7e-7a7b-4fcb-897e-bcbfae745554',6,'06:00:00','23:00:00',1,NULL,NULL,'Asia/Kolkata','2026-11-19 09:37:28','2026-11-19 09:37:28'),('c62487e0-b720-42b7-bd86-1df8587e0ea8','332a1c15-005b-4f0b-90e2-56cb8cae8312',1,'06:00:00','23:00:00',1,NULL,NULL,'Asia/Kolkata','2026-11-19 09:37:28','2026-11-19 09:37:28'),('e8c23c9b-8923-497d-9cb8-e18dc1e64373','332a1c15-005b-4f0b-90e2-56cb8cae8312',2,'06:00:00','23:00:00',1,NULL,NULL,'Asia/Kolkata','2026-11-19 09:37:28','2026-11-19 09:37:28'),('f39e18b6-b58e-49c0-91c0-226fc0cc5954','bf903e7e-7a7b-4fcb-897e-bcbfae745554',2,'06:00:00','23:00:00',1,NULL,NULL,'Asia/Kolkata','2026-11-19 09:37:28','2026-11-19 09:37:28'),('f4007811-4d5f-448b-af6f-075b1423ed4f','dad753b4-225e-41b6-a890-651ad82a0019',5,'06:00:00','23:00:00',1,NULL,NULL,'Asia/Kolkata','2026-11-19 09:37:28','2026-11-19 09:37:28');
/*!40000 ALTER TABLE `provider_availabilities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `provider_documents`
--

DROP TABLE IF EXISTS `provider_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `provider_documents` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `provider_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `document_type` varchar(60) NOT NULL,
  `storage_key` varchar(512) NOT NULL,
  `status` enum('pending','approved','rejected','expired') NOT NULL DEFAULT 'pending',
  `expires_at` date DEFAULT NULL,
  `reviewed_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `rejection_reason` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `content_type` varchar(100) NOT NULL DEFAULT 'application/octet-stream',
  `file_size_bytes` int(10) unsigned DEFAULT NULL,
  `uploaded_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `provider_documents_provider_id_status` (`provider_id`,`status`),
  KEY `provider_documents_reviewed_by` (`reviewed_by`),
  KEY `provider_documents_document_type_status` (`document_type`,`status`),
  CONSTRAINT `provider_documents_ibfk_1` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `provider_documents_ibfk_2` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `provider_documents`
--

LOCK TABLES `provider_documents` WRITE;
/*!40000 ALTER TABLE `provider_documents` DISABLE KEYS */;
INSERT INTO `provider_documents` VALUES ('05727ffc-ecff-4b14-a006-43b55dfd9959','332a1c15-005b-4f0b-90e2-56cb8cae8312','identity_front','mock/front.jpg','approved',NULL,NULL,'2026-11-19 09:20:45',NULL,'2026-11-19 09:20:45','2026-11-19 09:20:45','application/octet-stream',NULL,'2026-11-19 09:20:45'),('472ac6c4-0300-421b-b83e-a52e39faaf42','dad753b4-225e-41b6-a890-651ad82a0019','identity_back','mock/back.jpg','approved',NULL,NULL,'2026-11-19 09:20:45',NULL,'2026-11-19 09:20:45','2026-11-19 09:20:45','application/octet-stream',NULL,'2026-11-19 09:20:45'),('97808581-ae96-44ea-9f66-0519ffe27901','d57d5638-64e4-4b66-ade2-bb6c8028fb27','identity_back','mock/back.jpg','approved',NULL,NULL,'2026-11-19 09:20:45',NULL,'2026-11-19 09:20:45','2026-11-19 09:20:45','application/octet-stream',NULL,'2026-11-19 09:20:45'),('9df5f49a-2452-40f8-812d-98c9d0e85d8f','bf903e7e-7a7b-4fcb-897e-bcbfae745554','identity_front','mock/front.jpg','approved',NULL,NULL,'2026-11-19 09:20:45',NULL,'2026-11-19 09:20:45','2026-11-19 09:20:45','application/octet-stream',NULL,'2026-11-19 09:20:45'),('a71560c9-26a7-40a1-b204-5d9fa283bfee','332a1c15-005b-4f0b-90e2-56cb8cae8312','identity_back','mock/back.jpg','approved',NULL,NULL,'2026-11-19 09:20:45',NULL,'2026-11-19 09:20:45','2026-11-19 09:20:45','application/octet-stream',NULL,'2026-11-19 09:20:45'),('de5db883-42d1-471b-99d2-02cbdf1d806a','bf903e7e-7a7b-4fcb-897e-bcbfae745554','identity_back','mock/back.jpg','approved',NULL,NULL,'2026-11-19 09:20:45',NULL,'2026-11-19 09:20:45','2026-11-19 09:20:45','application/octet-stream',NULL,'2026-11-19 09:20:45'),('f936a404-f1ac-4459-b49d-e6cc82163e34','d57d5638-64e4-4b66-ade2-bb6c8028fb27','identity_front','mock/front.jpg','approved',NULL,NULL,'2026-11-19 09:20:45',NULL,'2026-11-19 09:20:45','2026-11-19 09:20:45','application/octet-stream',NULL,'2026-11-19 09:20:45'),('fe4ef493-c159-4dbe-a9da-6e4a300718ab','dad753b4-225e-41b6-a890-651ad82a0019','identity_front','mock/front.jpg','approved',NULL,NULL,'2026-11-19 09:20:45',NULL,'2026-11-19 09:20:45','2026-11-19 09:20:45','application/octet-stream',NULL,'2026-11-19 09:20:45');
/*!40000 ALTER TABLE `provider_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `provider_services`
--

DROP TABLE IF EXISTS `provider_services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `provider_services` (
  `provider_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `service_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `custom_price` decimal(10,2) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`provider_id`,`service_id`),
  KEY `provider_services_service_id` (`service_id`),
  CONSTRAINT `provider_services_ibfk_1` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `provider_services_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `provider_services`
--

LOCK TABLES `provider_services` WRITE;
/*!40000 ALTER TABLE `provider_services` DISABLE KEYS */;
INSERT INTO `provider_services` VALUES ('332a1c15-005b-4f0b-90e2-56cb8cae8312','30000000-0000-4000-8000-000000000001',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('332a1c15-005b-4f0b-90e2-56cb8cae8312','30000000-0000-4000-8000-000000000002',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('332a1c15-005b-4f0b-90e2-56cb8cae8312','30000000-0000-4000-8000-000000000003',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('332a1c15-005b-4f0b-90e2-56cb8cae8312','30000000-0000-4000-8000-000000000011',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('332a1c15-005b-4f0b-90e2-56cb8cae8312','30000000-0000-4000-8000-000000000012',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('332a1c15-005b-4f0b-90e2-56cb8cae8312','30000000-0000-4000-8000-000000000013',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('332a1c15-005b-4f0b-90e2-56cb8cae8312','30000000-0000-4000-8000-000000000014',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('332a1c15-005b-4f0b-90e2-56cb8cae8312','30000000-0000-4000-8000-000000000015',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('332a1c15-005b-4f0b-90e2-56cb8cae8312','30000000-0000-4000-8000-000000000101',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('332a1c15-005b-4f0b-90e2-56cb8cae8312','30000000-0000-4000-8000-000000000102',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('332a1c15-005b-4f0b-90e2-56cb8cae8312','30000000-0000-4000-8000-000000000103',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('332a1c15-005b-4f0b-90e2-56cb8cae8312','30000000-0000-4000-8000-000000000104',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('332a1c15-005b-4f0b-90e2-56cb8cae8312','30000000-0000-4000-8000-000000000105',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('332a1c15-005b-4f0b-90e2-56cb8cae8312','6fa5a8a0-7449-4e92-b8cb-303adffac575',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('bf903e7e-7a7b-4fcb-897e-bcbfae745554','30000000-0000-4000-8000-000000000001',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('bf903e7e-7a7b-4fcb-897e-bcbfae745554','30000000-0000-4000-8000-000000000002',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('bf903e7e-7a7b-4fcb-897e-bcbfae745554','30000000-0000-4000-8000-000000000003',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('bf903e7e-7a7b-4fcb-897e-bcbfae745554','30000000-0000-4000-8000-000000000011',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('bf903e7e-7a7b-4fcb-897e-bcbfae745554','30000000-0000-4000-8000-000000000012',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('bf903e7e-7a7b-4fcb-897e-bcbfae745554','30000000-0000-4000-8000-000000000013',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('bf903e7e-7a7b-4fcb-897e-bcbfae745554','30000000-0000-4000-8000-000000000014',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('bf903e7e-7a7b-4fcb-897e-bcbfae745554','30000000-0000-4000-8000-000000000015',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('bf903e7e-7a7b-4fcb-897e-bcbfae745554','30000000-0000-4000-8000-000000000101',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('bf903e7e-7a7b-4fcb-897e-bcbfae745554','30000000-0000-4000-8000-000000000102',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('bf903e7e-7a7b-4fcb-897e-bcbfae745554','30000000-0000-4000-8000-000000000103',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('bf903e7e-7a7b-4fcb-897e-bcbfae745554','30000000-0000-4000-8000-000000000104',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('bf903e7e-7a7b-4fcb-897e-bcbfae745554','30000000-0000-4000-8000-000000000105',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('bf903e7e-7a7b-4fcb-897e-bcbfae745554','6fa5a8a0-7449-4e92-b8cb-303adffac575',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('d57d5638-64e4-4b66-ade2-bb6c8028fb27','30000000-0000-4000-8000-000000000001',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('d57d5638-64e4-4b66-ade2-bb6c8028fb27','30000000-0000-4000-8000-000000000002',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('d57d5638-64e4-4b66-ade2-bb6c8028fb27','30000000-0000-4000-8000-000000000003',NULL,1,'2026-11-19 08:56:48','2026-11-19 08:56:48'),('d57d5638-64e4-4b66-ade2-bb6c8028fb27','30000000-0000-4000-8000-000000000011',NULL,1,'2026-11-19 08:56:48','2026-11-19 08:56:48'),('d57d5638-64e4-4b66-ade2-bb6c8028fb27','30000000-0000-4000-8000-000000000012',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('d57d5638-64e4-4b66-ade2-bb6c8028fb27','30000000-0000-4000-8000-000000000013',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('d57d5638-64e4-4b66-ade2-bb6c8028fb27','30000000-0000-4000-8000-000000000014',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('d57d5638-64e4-4b66-ade2-bb6c8028fb27','30000000-0000-4000-8000-000000000015',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('d57d5638-64e4-4b66-ade2-bb6c8028fb27','30000000-0000-4000-8000-000000000101',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('d57d5638-64e4-4b66-ade2-bb6c8028fb27','30000000-0000-4000-8000-000000000102',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('d57d5638-64e4-4b66-ade2-bb6c8028fb27','30000000-0000-4000-8000-000000000103',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('d57d5638-64e4-4b66-ade2-bb6c8028fb27','30000000-0000-4000-8000-000000000104',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('d57d5638-64e4-4b66-ade2-bb6c8028fb27','30000000-0000-4000-8000-000000000105',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('d57d5638-64e4-4b66-ade2-bb6c8028fb27','6fa5a8a0-7449-4e92-b8cb-303adffac575',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('dad753b4-225e-41b6-a890-651ad82a0019','30000000-0000-4000-8000-000000000001',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('dad753b4-225e-41b6-a890-651ad82a0019','30000000-0000-4000-8000-000000000002',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('dad753b4-225e-41b6-a890-651ad82a0019','30000000-0000-4000-8000-000000000003',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('dad753b4-225e-41b6-a890-651ad82a0019','30000000-0000-4000-8000-000000000011',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('dad753b4-225e-41b6-a890-651ad82a0019','30000000-0000-4000-8000-000000000012',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('dad753b4-225e-41b6-a890-651ad82a0019','30000000-0000-4000-8000-000000000013',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('dad753b4-225e-41b6-a890-651ad82a0019','30000000-0000-4000-8000-000000000014',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('dad753b4-225e-41b6-a890-651ad82a0019','30000000-0000-4000-8000-000000000015',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('dad753b4-225e-41b6-a890-651ad82a0019','30000000-0000-4000-8000-000000000101',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('dad753b4-225e-41b6-a890-651ad82a0019','30000000-0000-4000-8000-000000000102',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('dad753b4-225e-41b6-a890-651ad82a0019','30000000-0000-4000-8000-000000000103',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('dad753b4-225e-41b6-a890-651ad82a0019','30000000-0000-4000-8000-000000000104',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('dad753b4-225e-41b6-a890-651ad82a0019','30000000-0000-4000-8000-000000000105',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28'),('dad753b4-225e-41b6-a890-651ad82a0019','6fa5a8a0-7449-4e92-b8cb-303adffac575',NULL,1,'2026-11-19 09:37:28','2026-11-19 09:37:28');
/*!40000 ALTER TABLE `provider_services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `providers`
--

DROP TABLE IF EXISTS `providers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `providers` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `display_name` varchar(120) NOT NULL,
  `business_name` varchar(160) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `approval_status` enum('pending','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
  `experience_years` int(11) NOT NULL DEFAULT 0,
  `average_rating` decimal(3,2) NOT NULL DEFAULT 0.00,
  `review_count` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `legal_name` varchar(160) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `professional_title` varchar(120) DEFAULT NULL,
  `business_type` varchar(80) DEFAULT NULL,
  `approval_reviewed_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `approval_reviewed_at` datetime DEFAULT NULL,
  `rejection_reason` varchar(500) DEFAULT NULL,
  `identity_verified` tinyint(1) NOT NULL DEFAULT 0,
  `is_online` tinyint(1) NOT NULL DEFAULT 0,
  `avatar_url` varchar(2048) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `providers_approval_status` (`approval_status`),
  KEY `providers_approval_status_identity_verified_is_online` (`approval_status`,`identity_verified`,`is_online`),
  KEY `providers_approval_reviewed_by` (`approval_reviewed_by`),
  CONSTRAINT `providers_approval_reviewed_by_foreign_idx` FOREIGN KEY (`approval_reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `providers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `providers`
--

LOCK TABLES `providers` WRITE;
/*!40000 ALTER TABLE `providers` DISABLE KEYS */;
INSERT INTO `providers` VALUES ('332a1c15-005b-4f0b-90e2-56cb8cae8312','12d19aa5-638f-4d19-950a-f6e303ce8068','Jane Plumbing Services',NULL,'Top rated expert in bathroom fittings, leak detection, and sanitary maintenance with prompt arrival.','approved',7,0.00,0,'2026-11-19 05:25:27','2026-11-19 09:38:53',NULL,NULL,'Master Licensed Plumber',NULL,'ffd5bfe2-80f3-4d1c-b099-0ec7ddee7394','2026-11-19 05:40:05','rsg',1,1,'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'),('bf903e7e-7a7b-4fcb-897e-bcbfae745554','b769ee4b-5f63-4e78-b0c1-af64ab8fd0ba','Bob Repair',NULL,'Specialist in foam-jet air conditioning maintenance, circuit diagnosis, and modern appliances.','approved',5,0.00,0,'2026-11-19 05:54:25','2026-11-19 09:38:53',NULL,NULL,'HVAC & Electrical Engineer',NULL,'09d612e0-c87f-4b01-8797-57c98550fc8c','2026-11-19 05:54:36',NULL,1,1,'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80'),('d57d5638-64e4-4b66-ade2-bb6c8028fb27','250c8039-0b58-4853-9d73-b451fe5b38ee','Arjun Sharma (Home Specialist)',NULL,'Over 6 years of expertise in intensive apartment sanitization, upholstery care, and home inspections.','approved',6,0.00,0,'2026-11-19 05:49:58','2026-11-19 09:38:53',NULL,NULL,'Senior Home & Deep Clean Specialist',NULL,'ffd5bfe2-80f3-4d1c-b099-0ec7ddee7394','2026-11-19 05:56:10',NULL,1,1,'https://urbanmate.towsindia.com/uploads/avatar_d57d5638-64e4-4b66-ade2-bb6c8028fb27_1795078396252_e38e7289.jpg'),('dad753b4-225e-41b6-a890-651ad82a0019','2dd33377-64d5-40ba-a205-ea8c51b784ef','Karan & Team (Salon Experts)',NULL,'Certified professional with premium salon brands, advanced styling, and hygienic doorstep care.','approved',4,0.00,0,'2026-11-19 05:36:40','2026-11-19 09:38:53',NULL,NULL,'Grooming & Salon Stylist',NULL,NULL,NULL,NULL,1,1,'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80');
/*!40000 ALTER TABLE `providers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `refresh_tokens` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `token_hash` varchar(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `replaced_by_token_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_by_ip` varchar(45) DEFAULT NULL,
  `user_agent` varchar(512) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `replaced_by_token_id` (`replaced_by_token_id`),
  KEY `refresh_tokens_user_id_revoked_at` (`user_id`,`revoked_at`),
  KEY `refresh_tokens_expires_at` (`expires_at`),
  CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `refresh_tokens_ibfk_2` FOREIGN KEY (`replaced_by_token_id`) REFERENCES `refresh_tokens` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_tokens`
--

LOCK TABLES `refresh_tokens` WRITE;
/*!40000 ALTER TABLE `refresh_tokens` DISABLE KEYS */;
INSERT INTO `refresh_tokens` VALUES ('03b779a7-20f9-4d6d-a8a8-e62666948755','d41d50cb-f792-4a0e-8346-63ee4b5b909b','289b02953f3fd9c8325ec09da2feaa2e3d70e68616617dc5866b40eb063f2ef6','2026-12-19 11:25:24','2026-11-19 12:49:58','dd4e107e-81af-4812-aa3a-be5ffbd304b1','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36','2026-11-19 11:25:24','2026-11-19 12:49:58'),('09916b28-0def-4b07-82dd-3324ee4aa674','250c8039-0b58-4853-9d73-b451fe5b38ee','0d1958233ae1a81c375da507685225e92fd478d14381c6137df33f1e9f04f70a','2026-12-19 13:13:33','2026-11-19 13:13:33','841a16fe-930f-4ce6-b418-26ef4e83fdf4','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36 Edg/157.0.0.0','2026-11-19 13:13:33','2026-11-19 13:13:33'),('09f87ca9-9a32-411d-9078-748b3d41522d','d41d50cb-f792-4a0e-8346-63ee4b5b909b','c858bee9957af766a7a4f6a8b35438be9c76bf10544fbdc7ff3e1e6af377695a','2026-12-19 05:26:37','2026-11-19 05:27:05',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-19 05:26:37','2026-11-19 05:27:05'),('0a0be373-a1ea-4ef4-adac-97f3d3ab9969','250c8039-0b58-4853-9d73-b451fe5b38ee','dd5310a8533723f9003807feeb57c613556d83f09d9e296d3d70e715fd0b32fd','2026-12-19 05:49:58','2026-11-19 05:50:33',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36','2026-11-19 05:49:58','2026-11-19 05:50:33'),('1aa4dbf2-dedb-4210-aa28-8df22e3e08df','09d612e0-c87f-4b01-8797-57c98550fc8c','cba7174958bfa2d40b7614d24a7cb6481220b0aede53d610ba94ced07cee222d','2026-12-19 05:54:25',NULL,NULL,'::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.19041.6456','2026-11-19 05:54:25','2026-11-19 05:54:25'),('1ebd54ff-f05b-4d68-8079-8f4cb28e3449','d41d50cb-f792-4a0e-8346-63ee4b5b909b','cbeac21cca81e895bb2edeb5dc9db602be0432b0bd2d017ad6688a6f2190942d','2026-12-19 11:27:33','2026-11-19 11:30:28',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-19 11:27:33','2026-11-19 11:30:28'),('213eb2c7-9c53-4443-997f-4e1db76c8f58','ffd5bfe2-80f3-4d1c-b099-0ec7ddee7394','b260b0979d9f99a60891aea5fa962f255cca1637d4247a79024d74e10b3ffbdd','2026-12-19 07:25:36','2026-11-19 08:01:30','fbebfe37-f849-4017-9f0b-c3614bdb1dba','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36 Edg/157.0.0.0','2026-11-19 07:25:36','2026-11-19 08:01:30'),('2587f12b-dc15-4247-9adf-075a0099a2d5','09d612e0-c87f-4b01-8797-57c98550fc8c','37c35dcd9f7866787a07cd6a0cf189b06d7f4c543c2c6ec68af7c52649c7fcd2','2026-12-19 05:25:37',NULL,NULL,'::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.19041.6456','2026-11-19 05:25:37','2026-11-19 05:25:37'),('2b2e4253-e4ba-4bce-8704-b120b36dffd9','ffd5bfe2-80f3-4d1c-b099-0ec7ddee7394','691692a4e2fbef3d0a4e40e79010adc4f2b954b61a16528a4c2d73e8313319e7','2026-12-19 06:06:47','2026-11-19 06:44:33','f292c7c6-d262-4a11-97a9-b66a04361775','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36 Edg/157.0.0.0','2026-11-19 06:06:47','2026-11-19 06:44:33'),('2bdf2a09-72d5-4304-ab4d-f7ba27e96f95','d41d50cb-f792-4a0e-8346-63ee4b5b909b','e6ae1087d27f5aa784cb974d27baa33b25604b107bcad543e31f02335fa2987a','2026-12-19 08:58:06','2026-11-19 09:04:35',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36','2026-11-19 08:58:06','2026-11-19 09:04:35'),('3262f73d-85a9-4908-a9b0-6a5e03897a36','ffd5bfe2-80f3-4d1c-b099-0ec7ddee7394','ded2f06ce4e89cc6ab1abce08cf5fd5605eef5a7d98c6f457926910745cc5e3d','2026-12-19 08:54:02','2026-11-19 08:55:10','df58625b-78b6-49a4-a9b3-4e36e125ec75','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36 Edg/157.0.0.0','2026-11-19 08:54:02','2026-11-19 08:55:10'),('4166e130-acbd-4355-97e7-efa3c64ae046','d41d50cb-f792-4a0e-8346-63ee4b5b909b','6b32514c06af53aeb7222dab8420c39146ccf87b44df8f68f4529a6ae6df271b','2026-12-19 13:14:33','2026-11-19 13:33:13','d393645b-33ff-4c1e-8cfc-8a2d6327847c','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-19 13:14:33','2026-11-19 13:33:13'),('4d032556-bf31-48d5-994c-f9ecd23a2ff9','ffd5bfe2-80f3-4d1c-b099-0ec7ddee7394','903f4ebe0a3d797e7bbd145ff6cdeb5a74acb0bc012db5ec8558e9e6642373fa','2026-12-19 13:12:34','2026-11-19 13:28:33','b9fe9c64-f0bd-4cd3-b22f-abee6dd30e2d','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36','2026-11-19 13:12:34','2026-11-19 13:28:33'),('507a1a0e-c36b-46f1-b3bb-02a90d29f85f','ffd5bfe2-80f3-4d1c-b099-0ec7ddee7394','a109896ed76270f007d524b05749bc5c852d9ab584c11e63ab412b3b128d81f5','2026-12-19 08:55:30','2026-11-19 09:20:51','6d22eed6-b83f-428e-bfad-ccd73c01f610','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-19 08:55:30','2026-11-19 09:20:51'),('51e7869c-566e-4eba-aea2-d0a3117eb829','d41d50cb-f792-4a0e-8346-63ee4b5b909b','1e89c0f439623d3a444ee66f24bc9a9cbdb17c2d093b80b6e2f1ee2d9de4ce50','2026-12-19 06:45:45','2026-11-19 07:06:23','aab00b43-5cef-4746-8acf-f07cf84cd20f','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-19 06:45:45','2026-11-19 07:06:23'),('5649591a-c1e7-440b-90c0-ef82f81f79b5','2dd33377-64d5-40ba-a205-ea8c51b784ef','58bcbf596d9bed9eefcad62c94f54ad5907e2a6b43c8727337d1ef6fe26c179b','2026-12-19 05:48:03','2026-11-19 05:49:16',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36','2026-11-19 05:48:03','2026-11-19 05:49:16'),('6192cade-611c-46b5-a568-5b8046443f24','d41d50cb-f792-4a0e-8346-63ee4b5b909b','c6b286a7c78d995bb566cacd6787f159586cc46a2c6ea9b2c419f81506232654','2026-12-19 09:33:13','2026-11-19 11:25:24','03b779a7-20f9-4d6d-a8a8-e62666948755','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36','2026-11-19 09:33:13','2026-11-19 11:25:24'),('635b6f5e-a7f5-4230-b181-2bd62cad7a8a','09d612e0-c87f-4b01-8797-57c98550fc8c','ece69d890edf4019abcdb92dcfd42bb3b099604a7fbeb7f11b6b2804b113cf11','2026-12-19 11:30:14',NULL,NULL,'::1','node','2026-11-19 11:30:14','2026-11-19 11:30:14'),('66bdb5ec-ba74-4dcd-ac0d-ad4e5fb8408e','ffd5bfe2-80f3-4d1c-b099-0ec7ddee7394','c56cd6d4e126d17e0206be72ba7cfe89a547d0434ef99328d59b127c1efd2470','2026-12-19 05:34:33','2026-11-19 05:50:10','afdb7db8-1382-4316-9d07-adb72921d2e1','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36 Edg/157.0.0.0','2026-11-19 05:34:33','2026-11-19 05:50:10'),('67914b6d-2e46-4fe9-9e0a-b9f49ab85c03','ffd5bfe2-80f3-4d1c-b099-0ec7ddee7394','3b90e90ffbfad5013ec808e00d781673061cd3c06704601b19d059378721cf90','2026-12-19 07:03:36','2026-11-19 07:25:36','213eb2c7-9c53-4443-997f-4e1db76c8f58','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36 Edg/157.0.0.0','2026-11-19 07:03:36','2026-11-19 07:25:36'),('68891226-d194-4b2d-aba2-f7372ed85177','250c8039-0b58-4853-9d73-b451fe5b38ee','048eeab125f6425873f321b7796da8d11068ff3732fe6644bc280a1ca676c6ed','2026-12-19 12:57:55','2026-11-19 13:13:33','09916b28-0def-4b07-82dd-3324ee4aa674','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36 Edg/157.0.0.0','2026-11-19 12:57:55','2026-11-19 13:13:33'),('69805855-1688-4a89-a62d-5a94365a46a5','250c8039-0b58-4853-9d73-b451fe5b38ee','6ed3ea4194e90986cdfe3aa5f9999aa941fec43168c2ddee8a2813391dbbb5d6','2026-12-19 08:52:13','2026-11-19 08:57:44',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36','2026-11-19 08:52:13','2026-11-19 08:57:44'),('6b4f9032-22be-45ef-afc1-4a3273864ad2','d41d50cb-f792-4a0e-8346-63ee4b5b909b','b2e1b2a8943cbba3f45c238b977a853bce253a29ab76ca38e9c1cf1249591c38','2026-12-19 05:27:11','2026-11-19 05:43:13','7fb1e426-f7e6-4acd-816f-23a1cdd5d98d','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-19 05:27:11','2026-11-19 05:43:13'),('6d22eed6-b83f-428e-bfad-ccd73c01f610','ffd5bfe2-80f3-4d1c-b099-0ec7ddee7394','62cad389943255316f59bbaed86819597e951ac7e87e9d70b826263206ec5cf0','2026-12-19 09:20:51',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-19 09:20:51','2026-11-19 09:20:51'),('71808dc7-8009-4857-b5d6-0bd5007be3e7','250c8039-0b58-4853-9d73-b451fe5b38ee','13907e96153ef77d2385f9f3f099afba381da442961b4a97b594fee463cba3f4','2026-12-19 10:28:47','2026-11-19 11:23:27','820df9f4-b2e4-4f2f-9306-e52d7815e727','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36 Edg/157.0.0.0','2026-11-19 10:28:47','2026-11-19 11:23:27'),('742e2e98-6933-4126-9d0a-569ad750a25f','09d612e0-c87f-4b01-8797-57c98550fc8c','d13261cfc3d01aaf0ef52f6db99eff764b83dde99494578ce7e3c8abaf685d6b','2026-12-19 05:23:51',NULL,NULL,'::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.19041.6456','2026-11-19 05:23:51','2026-11-19 05:23:51'),('7fb1e426-f7e6-4acd-816f-23a1cdd5d98d','d41d50cb-f792-4a0e-8346-63ee4b5b909b','89951a120a5ddab1a7fd4c542019da43a7386ec006c58769a1c74c9e29b45cd5','2026-12-19 05:43:13','2026-11-19 06:01:16','d5e6ff2b-f985-43f6-9df4-805a33e8273f','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-19 05:43:13','2026-11-19 06:01:16'),('820df9f4-b2e4-4f2f-9306-e52d7815e727','250c8039-0b58-4853-9d73-b451fe5b38ee','28cf1a2623a2c91410dd6646aeae5782b31a1cbcd275326215d9a27f47f254c1','2026-12-19 11:23:27','2026-11-19 12:42:55','c4fcfa45-910c-4193-a9bd-4770158c7e47','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36 Edg/157.0.0.0','2026-11-19 11:23:27','2026-11-19 12:42:55'),('841a16fe-930f-4ce6-b418-26ef4e83fdf4','250c8039-0b58-4853-9d73-b451fe5b38ee','79dcfd02d4943d9863e2f81615099cea4ae8fccdea2b85387cf177a609bed44e','2026-12-19 13:13:33','2026-11-19 13:37:57','8f744024-2f94-44bc-a049-00d9afc3567b','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36 Edg/157.0.0.0','2026-11-19 13:13:33','2026-11-19 13:37:57'),('847d77c8-a7ca-4dc8-bcc3-0083ed17d589','c0492ac0-b678-4ebf-a734-2c9e01d679aa','6fd878bc230c29893a53e62519cd6ee4c90fc9bb035d0e41e1c570199544df47','2026-12-19 05:33:44',NULL,NULL,'::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.19041.6456','2026-11-19 05:33:44','2026-11-19 05:33:44'),('84f0e09c-4380-431a-8ffc-f845610ffad5','250c8039-0b58-4853-9d73-b451fe5b38ee','24e2560a9a570b22c9dbd6638d73efdc0a08f018f0479e5dc221cc34c5bb0b30','2026-12-19 10:10:53','2026-11-19 10:28:47','71808dc7-8009-4857-b5d6-0bd5007be3e7','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36 Edg/157.0.0.0','2026-11-19 10:10:53','2026-11-19 10:28:47'),('8aaea5c3-cce1-4124-8f40-09a26758dc46','250c8039-0b58-4853-9d73-b451fe5b38ee','766dd33cef53e665bd4d5448bc9c632ec521d4c493b563e9fd43a5b011ec28e0','2026-12-19 06:46:24','2026-11-19 07:03:42','f0f268ac-57c8-4529-a49d-171a323bec32','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36','2026-11-19 06:46:24','2026-11-19 07:03:42'),('8ba596f0-7c9a-4ca8-945d-ecd5845264e1','ffd5bfe2-80f3-4d1c-b099-0ec7ddee7394','d44d0aca9669dc76712b126791d65785b79351a899972b0ad2ff72cb5bf741b9','2026-12-19 08:23:47','2026-11-19 08:45:01','f51723b8-06c3-4eca-a11c-05f5cdef8946','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36 Edg/157.0.0.0','2026-11-19 08:23:47','2026-11-19 08:45:01'),('8f744024-2f94-44bc-a049-00d9afc3567b','250c8039-0b58-4853-9d73-b451fe5b38ee','84ec0b46f7d95cda663f83c02b4f993a64d0f7a44a7825a6481d21115c2d4f40','2026-12-19 13:37:57',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36 Edg/157.0.0.0','2026-11-19 13:37:57','2026-11-19 13:37:57'),('8fa13f2f-3780-4977-aa88-04f5aab019f6','ffd5bfe2-80f3-4d1c-b099-0ec7ddee7394','7586889d4e17d0b4bd1ca7c19589476b1ba66b00db6e7ce494a399f076828835','2026-12-19 12:43:12','2026-11-19 12:44:24',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-19 12:43:12','2026-11-19 12:44:24'),('95dc76e9-3661-40d8-b18c-80a998abaee9','c332acaf-d18d-4d9b-a3fa-305ad017c601','74fa9a4b8515c8fde1b02f1ef6e5b7c341831b1a2b1d3afbb01ea918dbc26200','2026-12-19 05:25:27','2026-11-19 08:56:06',NULL,'::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.19041.6456','2026-11-19 05:25:27','2026-11-19 08:56:06'),('9a685bc2-15cf-410d-bda4-c0d61aa8a921','d41d50cb-f792-4a0e-8346-63ee4b5b909b','97592aa938f9a41023d4d227cbf6469d3463282922b8e6b639442a7932d9bd51','2026-12-19 12:44:31','2026-11-19 12:59:32','be2186d3-8458-4e14-8951-3930a09b0dbb','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-19 12:44:31','2026-11-19 12:59:32'),('9c15b884-87d9-481e-9528-cd817e9dbc3a','250c8039-0b58-4853-9d73-b451fe5b38ee','821d81681693db0d069b8d445660a2353cd032c1a3f5339324d3c7d99a7f4f48','2026-12-19 08:56:41','2026-11-19 09:12:07','bad6bd66-a02a-4e19-9988-e88be613b433','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36 Edg/157.0.0.0','2026-11-19 08:56:41','2026-11-19 09:12:07'),('aab00b43-5cef-4746-8acf-f07cf84cd20f','d41d50cb-f792-4a0e-8346-63ee4b5b909b','4601593489af5f9ddd7220df76f07f809f3703fa55a9b9b42eae7f46215d8aaa','2026-12-19 07:06:23','2026-11-19 07:06:48',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-19 07:06:23','2026-11-19 07:06:48'),('afdb7db8-1382-4316-9d07-adb72921d2e1','ffd5bfe2-80f3-4d1c-b099-0ec7ddee7394','e068c78e18f1aaf65660ac29625f187e62930988b8bf212ede7149fb8a823ed3','2026-12-19 05:50:10','2026-11-19 06:06:47','2b2e4253-e4ba-4bce-8704-b120b36dffd9','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36 Edg/157.0.0.0','2026-11-19 05:50:10','2026-11-19 06:06:47'),('b20718ad-cb25-4294-887e-332152ea3ba7','09d612e0-c87f-4b01-8797-57c98550fc8c','b623300e2b5813644f33a1ad4c0ced72c0a19fa6a88b5e8171a0222364a44d43','2026-12-19 05:23:43',NULL,NULL,'::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.19041.6456','2026-11-19 05:23:43','2026-11-19 05:23:43'),('b8925293-08a0-4dbc-9450-86f14c658966','09d612e0-c87f-4b01-8797-57c98550fc8c','1db6864dd36b83650eaca7568d058372c9729a1b9b2421ae84b9eb2957b2a564','2026-12-19 05:54:36',NULL,NULL,'::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.19041.6456','2026-11-19 05:54:36','2026-11-19 05:54:36'),('b9fe9c64-f0bd-4cd3-b22f-abee6dd30e2d','ffd5bfe2-80f3-4d1c-b099-0ec7ddee7394','d4636030b589351a6d9f2ec813398576519f09c093627da0fd0a476fd17a297f','2026-12-19 13:28:33',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36','2026-11-19 13:28:33','2026-11-19 13:28:33'),('bad6bd66-a02a-4e19-9988-e88be613b433','250c8039-0b58-4853-9d73-b451fe5b38ee','682420fa8eb5714da273cd6170f9317673e53ee648f44ac7136965f99f9af79f','2026-12-19 09:12:07','2026-11-19 09:33:42','d321a37a-a0bc-48b0-9072-df7cf1ae7523','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36 Edg/157.0.0.0','2026-11-19 09:12:07','2026-11-19 09:33:42'),('be16c2db-1aac-4020-b141-218665e88443','d41d50cb-f792-4a0e-8346-63ee4b5b909b','df0cbf0b56b8daf4d5bdd6b05d5c7b5b97ca4c1d0797837c61f3549ada7b4ec6','2026-12-19 13:11:57','2026-11-19 13:14:33','4166e130-acbd-4355-97e7-efa3c64ae046','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-19 13:11:57','2026-11-19 13:14:33'),('be2186d3-8458-4e14-8951-3930a09b0dbb','d41d50cb-f792-4a0e-8346-63ee4b5b909b','9dbeeb287878c970dbb599ecdcff250091718576d3a3fb24e330a4ed8e06a5a3','2026-12-19 12:59:32','2026-11-19 13:11:57','be16c2db-1aac-4020-b141-218665e88443','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-19 12:59:32','2026-11-19 13:11:57'),('c235bd3c-8f7c-445c-a8ae-00be1ee08868','ffd5bfe2-80f3-4d1c-b099-0ec7ddee7394','3305f6196542b08c3b436b61de9fa1308bd599798b2622dcec827f53cd432bcd','2026-12-19 10:29:48','2026-11-19 10:31:59',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-19 10:29:48','2026-11-19 10:31:59'),('c4fcfa45-910c-4193-a9bd-4770158c7e47','250c8039-0b58-4853-9d73-b451fe5b38ee','f52c8ed748f3d35293853fe1f4fb68d7c6281593b204948a3c3cedb59d741e8c','2026-12-19 12:42:55','2026-11-19 12:57:55','68891226-d194-4b2d-aba2-f7372ed85177','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36 Edg/157.0.0.0','2026-11-19 12:42:55','2026-11-19 12:57:55'),('cc2cd29a-82a6-4ef3-8049-b555bc2d7e7e','b769ee4b-5f63-4e78-b0c1-af64ab8fd0ba','7dc02fc031210b9f34434e2b5fe350bc43808958d7b5a6e90a46276aa8e87fd1','2026-12-19 05:54:25',NULL,NULL,'::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.19041.6456','2026-11-19 05:54:25','2026-11-19 05:54:25'),('ccb4e5b6-1d45-4426-a779-d51a4f2d6561','250c8039-0b58-4853-9d73-b451fe5b38ee','62827f26290b9697ccfe86b03fc0c23f838ccd31a9c8a80624e7134590cc35e5','2026-12-19 05:50:38','2026-11-19 06:46:24','8aaea5c3-cce1-4124-8f40-09a26758dc46','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36','2026-11-19 05:50:38','2026-11-19 06:46:24'),('cd5d3ca0-1d04-480a-9beb-56a8067be5d7','d41d50cb-f792-4a0e-8346-63ee4b5b909b','3252a552dec2cf0911e7cec5eddf431edd35f1c5644f38c01a2aae59d49fe45b','2026-12-19 11:18:04','2026-11-19 11:36:14',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-19 11:18:04','2026-11-19 11:36:14'),('cd7fffec-f448-4976-b257-912dddb2660a','ffd5bfe2-80f3-4d1c-b099-0ec7ddee7394','984ab1e41168efdaaeab006b0175cb42aa4afe45c269569a528dd9edac9be88d','2026-12-19 11:36:42','2026-11-19 12:43:12','8fa13f2f-3780-4977-aa88-04f5aab019f6','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-19 11:36:42','2026-11-19 12:43:12'),('d321a37a-a0bc-48b0-9072-df7cf1ae7523','250c8039-0b58-4853-9d73-b451fe5b38ee','93134cdc2d317c2a08b48ec1b64deb49fd267e0f3ab708984bef0425639f9ad8','2026-12-19 09:33:42','2026-11-19 10:10:53','84f0e09c-4380-431a-8ffc-f845610ffad5','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36 Edg/157.0.0.0','2026-11-19 09:33:42','2026-11-19 10:10:53'),('d393645b-33ff-4c1e-8cfc-8a2d6327847c','d41d50cb-f792-4a0e-8346-63ee4b5b909b','7667089d2b48b8ec20f831f88ea9a86507acd3695e501f20cb2d8d674a05c004','2026-12-19 13:33:13',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-19 13:33:13','2026-11-19 13:33:13'),('d5e6ff2b-f985-43f6-9df4-805a33e8273f','d41d50cb-f792-4a0e-8346-63ee4b5b909b','430fe0d7b2df7b599c175388bb0cee602a31d892d90a36cbc3147364c55c6cf2','2026-12-19 06:01:16','2026-11-19 06:45:45','51e7869c-566e-4eba-aea2-d0a3117eb829','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-19 06:01:16','2026-11-19 06:45:45'),('d739330a-1121-42f9-bc9a-387fb695e78c','c332acaf-d18d-4d9b-a3fa-305ad017c601','3f70ba6f24b69415483f4b8f03a1b259270ffa0509007d5f8e743135505a3539','2026-12-19 05:25:36','2026-11-19 08:56:06',NULL,'::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.19041.6456','2026-11-19 05:25:36','2026-11-19 08:56:06'),('d8785bd6-b3fd-4751-81ff-58983d1b157f','12d19aa5-638f-4d19-950a-f6e303ce8068','3667de3704be506f92e7cf845ce389425cf2beb402bd8a5e15208dcd5b5b00f7','2026-12-19 05:25:27','2026-11-19 08:56:08',NULL,'::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.19041.6456','2026-11-19 05:25:27','2026-11-19 08:56:08'),('da7fa591-f271-4c97-8a23-39c3cd55da57','12d19aa5-638f-4d19-950a-f6e303ce8068','af7e0a21d3cff3a0b24c236d46757267bfb1a11c4a5500efa7d8c1cf02cf3609','2026-12-19 05:25:36','2026-11-19 08:56:08',NULL,'::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.19041.6456','2026-11-19 05:25:36','2026-11-19 08:56:08'),('dd4e107e-81af-4812-aa3a-be5ffbd304b1','d41d50cb-f792-4a0e-8346-63ee4b5b909b','b638e770d639d7025ebf95949f6b1fbda84d0c503e04d59466a51ae1dd24f8f6','2026-12-19 12:49:58','2026-11-19 12:57:07',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36','2026-11-19 12:49:58','2026-11-19 12:57:07'),('df58625b-78b6-49a4-a9b3-4e36e125ec75','ffd5bfe2-80f3-4d1c-b099-0ec7ddee7394','fef255df5f59587e68de8a9ad64babee28ccd9870031016ed7fb0e6c643a927a','2026-12-19 08:55:10','2026-11-19 08:55:16',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36 Edg/157.0.0.0','2026-11-19 08:55:10','2026-11-19 08:55:16'),('f0f268ac-57c8-4529-a49d-171a323bec32','250c8039-0b58-4853-9d73-b451fe5b38ee','20f0dcd587e1eb8aa519318d1c7a777fdd590d986ba7132ddb3f72eb394f9c67','2026-12-19 07:03:42','2026-11-19 08:30:37','f1616a95-3545-4bc3-895e-cf1d7bd07bc0','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36','2026-11-19 07:03:42','2026-11-19 08:30:37'),('f1616a95-3545-4bc3-895e-cf1d7bd07bc0','250c8039-0b58-4853-9d73-b451fe5b38ee','068a10c96e6d1cda5d8d08d7e4cbefeb624c3d8990a6d65068f5d45ccf2d8db0','2026-12-19 08:30:37','2026-11-19 08:52:13','69805855-1688-4a89-a62d-5a94365a46a5','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36','2026-11-19 08:30:37','2026-11-19 08:52:13'),('f292c7c6-d262-4a11-97a9-b66a04361775','ffd5bfe2-80f3-4d1c-b099-0ec7ddee7394','94523bcea9f5fbc6d58d11e63a0991f0f454d3ca5e806c5085913678c9f47a4a','2026-12-19 06:44:33','2026-11-19 07:03:36','67914b6d-2e46-4fe9-9e0a-b9f49ab85c03','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36 Edg/157.0.0.0','2026-11-19 06:44:33','2026-11-19 07:03:36'),('f45bab46-85fb-48ac-b853-3a28560992e4','ffd5bfe2-80f3-4d1c-b099-0ec7ddee7394','3a38b5aeb765b090d47998fd1c07981467d654cb616872f2f1aee711a071f126','2026-12-19 12:57:13','2026-11-19 13:12:34','4d032556-bf31-48d5-994c-f9ecd23a2ff9','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36','2026-11-19 12:57:13','2026-11-19 13:12:34'),('f51723b8-06c3-4eca-a11c-05f5cdef8946','ffd5bfe2-80f3-4d1c-b099-0ec7ddee7394','f82804585c18d1e7dc11f2617e972c2acc472b6f45051ca7c5934b577d520157','2026-12-19 08:45:01','2026-11-19 08:53:58',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36 Edg/157.0.0.0','2026-11-19 08:45:01','2026-11-19 08:53:58'),('fbebfe37-f849-4017-9f0b-c3614bdb1dba','ffd5bfe2-80f3-4d1c-b099-0ec7ddee7394','dfea52385a04c6b099e782cc8a0fc8f818e47947808ae3e6a5bee243d15416d0','2026-12-19 08:01:30','2026-11-19 08:23:47','8ba596f0-7c9a-4ca8-945d-ecd5845264e1','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36 Edg/157.0.0.0','2026-11-19 08:01:30','2026-11-19 08:23:47'),('fe576598-416f-46b1-b503-e3206731a309','d41d50cb-f792-4a0e-8346-63ee4b5b909b','700582e9f43113349464beb4ec292adb94326490af9d05a8d1e04561e7959090','2026-12-19 10:09:39',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-19 10:09:39','2026-11-19 10:09:39'),('fe674db3-81db-401c-b182-5e728caca0d7','2dd33377-64d5-40ba-a205-ea8c51b784ef','d7c68470e98177e4a55ba59c8b74fae6ef4d4de07345b18b54d671c5a6342f2a','2026-12-19 05:36:40','2026-11-19 05:47:02',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36','2026-11-19 05:36:40','2026-11-19 05:47:02');
/*!40000 ALTER TABLE `refresh_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reviews` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `booking_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `customer_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `provider_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `rating` tinyint(3) unsigned NOT NULL,
  `comment` text DEFAULT NULL,
  `status` enum('published','hidden','flagged') NOT NULL DEFAULT 'published',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `booking_id` (`booking_id`),
  KEY `reviews_provider_id_status` (`provider_id`,`status`),
  KEY `reviews_customer_id` (`customer_id`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `reviews_ibfk_3` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roles` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(40) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES ('10000000-0000-4000-8000-000000000001','customer','Customer account','2026-11-19 05:21:28','2026-11-19 08:17:27'),('10000000-0000-4000-8000-000000000002','provider','Service provider account','2026-11-19 05:21:28','2026-11-19 08:17:27'),('10000000-0000-4000-8000-000000000003','admin','Platform administrator','2026-11-19 05:21:28','2026-11-19 08:17:27');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sequelizemeta`
--

DROP TABLE IF EXISTS `sequelizemeta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sequelizemeta` (
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sequelizemeta`
--

LOCK TABLES `sequelizemeta` WRITE;
/*!40000 ALTER TABLE `sequelizemeta` DISABLE KEYS */;
INSERT INTO `sequelizemeta` VALUES ('202611070001-create-marketplace-schema.js'),('202611070002-create-auth-session-tables.js'),('202611070003-expand-service-catalog.js'),('202611070004-link-bookings-to-service-options-and-areas.js'),('202611070004-seed-featured-categories.js'),('202611070005-expand-provider-management.js'),('202611070005-seed-popular-services.js'),('202611130001-add-booking-workflow.js'),('202611140001-add-category-image.js'),('202611140002-add-provider-avatar.js'),('202611140003-create-system-settings.js');
/*!40000 ALTER TABLE `sequelizemeta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_addons`
--

DROP TABLE IF EXISTS `service_addons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `service_addons` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `service_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(120) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `duration_minutes` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `service_addons_service_id_is_active_sort_order` (`service_id`,`is_active`,`sort_order`),
  CONSTRAINT `service_addons_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_addons`
--

LOCK TABLES `service_addons` WRITE;
/*!40000 ALTER TABLE `service_addons` DISABLE KEYS */;
/*!40000 ALTER TABLE `service_addons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_areas`
--

DROP TABLE IF EXISTS `service_areas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `service_areas` (
  `service_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `area_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`service_id`,`area_id`),
  KEY `service_areas_area_id_is_active` (`area_id`,`is_active`),
  CONSTRAINT `service_areas_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `service_areas_ibfk_2` FOREIGN KEY (`area_id`) REFERENCES `areas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_areas`
--

LOCK TABLES `service_areas` WRITE;
/*!40000 ALTER TABLE `service_areas` DISABLE KEYS */;
/*!40000 ALTER TABLE `service_areas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_categories`
--

DROP TABLE IF EXISTS `service_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `service_categories` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(120) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `parent_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `image_url` varchar(2048) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `service_categories_is_active_sort_order` (`is_active`,`sort_order`),
  KEY `service_categories_parent_id_is_active` (`parent_id`,`is_active`),
  CONSTRAINT `service_categories_parent_id_foreign_idx` FOREIGN KEY (`parent_id`) REFERENCES `service_categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_categories`
--

LOCK TABLES `service_categories` WRITE;
/*!40000 ALTER TABLE `service_categories` DISABLE KEYS */;
INSERT INTO `service_categories` VALUES ('20000000-0000-4000-8000-000000000001','Cleaning','cleaning','Home cleaning services',1,6,'2026-11-19 05:21:28','2026-11-19 08:17:27',NULL,'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&w=600&q=80'),('20000000-0000-4000-8000-000000000002','Plumbing','plumbing','Plumbing repairs and installations',1,7,'2026-11-19 05:21:28','2026-11-19 08:17:27',NULL,'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=600&q=80'),('20000000-0000-4000-8000-000000000003','Electrical','electrical','Electrical repairs and installations',1,8,'2026-11-19 05:21:28','2026-11-19 08:17:27',NULL,'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=600&q=80'),('20000000-0000-4000-8000-000000000011','Full Home/ By Room Cleaning','full-home-by-room-cleaning','Complete deep cleaning for entire homes or specific rooms by verified pros',1,1,'2026-11-19 08:41:35','2026-11-19 11:26:02',NULL,'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80'),('20000000-0000-4000-8000-000000000012','Statement design wall','statement-design-wall','Premium wood slat accent walls, textures, and bespoke decorative backdrops',1,2,'2026-11-19 08:41:35','2026-11-19 11:26:02',NULL,'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'),('20000000-0000-4000-8000-000000000013','Living & Bedroom Cleaning','living-bedroom-cleaning','Specialized upholstery, mattress, and dusting care for living and sleeping spaces',1,3,'2026-11-19 08:41:35','2026-11-19 11:26:02',NULL,'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80'),('20000000-0000-4000-8000-000000000014','Native Water Purifier','native-water-purifier','Next-generation smart RO+UV water purifiers with phone monitoring & filter alerts',1,4,'2026-11-19 08:41:35','2026-11-19 11:26:02',NULL,'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=600&q=80'),('20000000-0000-4000-8000-000000000015','Native Smart Locks','native-smart-locks','High-security keyless digital door locks with 3D face recognition & app unlock',1,5,'2026-11-19 08:41:35','2026-11-19 11:26:02',NULL,'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80'),('4b8191ee-c708-4a76-a5d2-81ff8f00e19d','Saloon','saloon',NULL,1,9,'2026-11-19 06:52:30','2026-11-19 08:41:56',NULL,'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSn4ImLi5j3PcQpmQvx2ilSNZipqhQSA1v0aQvvrQx6IgszRgPgAjLu0AOj&s=10');
/*!40000 ALTER TABLE `service_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_images`
--

DROP TABLE IF EXISTS `service_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `service_images` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `service_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `image_url` varchar(2048) NOT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `service_images_service_id_sort_order` (`service_id`,`sort_order`),
  CONSTRAINT `service_images_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_images`
--

LOCK TABLES `service_images` WRITE;
/*!40000 ALTER TABLE `service_images` DISABLE KEYS */;
INSERT INTO `service_images` VALUES ('40000000-0000-4000-8000-000000000011','30000000-0000-4000-8000-000000000011','https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80','Full home cleaning service',0,'2026-11-19 08:41:35','2026-11-19 11:26:02'),('40000000-0000-4000-8000-000000000012','30000000-0000-4000-8000-000000000012','https://www.urbancompany.com/img/images/growth/home-screen/1794421454113-a0f0a9.jpeg?bucket=urbanclap-prod&quality=85&format=auto','Statement design wall',0,'2026-11-19 08:41:35','2026-11-19 11:26:02'),('40000000-0000-4000-8000-000000000013','30000000-0000-4000-8000-000000000013','https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80','Living room cleaning',0,'2026-11-19 08:41:35','2026-11-19 11:26:02'),('40000000-0000-4000-8000-000000000014','30000000-0000-4000-8000-000000000014','https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=800&q=80','Native Water Purifier',0,'2026-11-19 08:41:35','2026-11-19 11:26:02'),('40000000-0000-4000-8000-000000000015','30000000-0000-4000-8000-000000000015','https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80','Native Smart Locks',0,'2026-11-19 08:41:35','2026-11-19 11:26:02'),('40000000-0000-4000-8000-000000000101','30000000-0000-4000-8000-000000000101','https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80','Threading',0,'2026-11-19 08:50:43','2026-11-19 11:26:02'),('40000000-0000-4000-8000-000000000102','30000000-0000-4000-8000-000000000102','https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80','Intense cleaning (2 bathroom)',0,'2026-11-19 08:50:43','2026-11-19 11:26:02'),('40000000-0000-4000-8000-000000000103','30000000-0000-4000-8000-000000000103','https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80','Foam-jet AC service',0,'2026-11-19 08:50:43','2026-11-19 11:26:02'),('40000000-0000-4000-8000-000000000104','30000000-0000-4000-8000-000000000104','https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80','Fabric sofa cleaning',0,'2026-11-19 08:50:43','2026-11-19 11:26:02'),('40000000-0000-4000-8000-000000000105','30000000-0000-4000-8000-000000000105','https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80','Furnished apartment - Home deep cleaning',0,'2026-11-19 08:50:43','2026-11-19 11:26:02'),('d9fb55de-3ef6-4b6e-83fd-3f7c25a6a89a','6fa5a8a0-7449-4e92-b8cb-303adffac575','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSn4ImLi5j3PcQpmQvx2ilSNZipqhQSA1v0aQvvrQx6IgszRgPgAjLu0AOj&s=10','Hair cutting',0,'2026-11-19 06:53:03','2026-11-19 06:53:03');
/*!40000 ALTER TABLE `service_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_packages`
--

DROP TABLE IF EXISTS `service_packages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `service_packages` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `service_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(120) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `duration_minutes` int(11) NOT NULL,
  `features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`features`)),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `service_packages_service_id_is_active_sort_order` (`service_id`,`is_active`,`sort_order`),
  CONSTRAINT `service_packages_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_packages`
--

LOCK TABLES `service_packages` WRITE;
/*!40000 ALTER TABLE `service_packages` DISABLE KEYS */;
INSERT INTO `service_packages` VALUES ('50000000-0000-4000-8000-000000000101','30000000-0000-4000-8000-000000000101','Eyebrows',NULL,49.00,10,'[\"Verified professional\",\"Standard warranty\"]',1,0,'2026-11-19 08:51:46','2026-11-19 11:26:02'),('50000000-0000-4000-8000-000000000102','30000000-0000-4000-8000-000000000101','Upper lip',NULL,39.00,5,'[\"Verified professional\",\"Standard warranty\"]',1,1,'2026-11-19 08:51:46','2026-11-19 11:26:02'),('50000000-0000-4000-8000-000000000103','30000000-0000-4000-8000-000000000101','Chin',NULL,39.00,5,'[\"Verified professional\",\"Standard warranty\"]',1,2,'2026-11-19 08:51:46','2026-11-19 11:26:02'),('50000000-0000-4000-8000-000000000104','30000000-0000-4000-8000-000000000101','Forehead',NULL,49.00,10,'[\"Verified professional\",\"Standard warranty\"]',1,3,'2026-11-19 08:51:46','2026-11-19 11:26:02'),('50000000-0000-4000-8000-000000000105','30000000-0000-4000-8000-000000000101','Full face',NULL,199.00,25,'[\"Verified professional\",\"Standard warranty\"]',1,4,'2026-11-19 08:51:46','2026-11-19 11:26:02'),('50000000-0000-4000-8000-000000000106','30000000-0000-4000-8000-000000000101','Sideburns',NULL,59.00,10,'[\"Verified professional\",\"Standard warranty\"]',1,5,'2026-11-19 08:51:46','2026-11-19 11:26:02'),('50000000-0000-4000-8000-000000000107','30000000-0000-4000-8000-000000000101','Jawline',NULL,49.00,10,'[\"Verified professional\",\"Standard warranty\"]',1,6,'2026-11-19 08:51:46','2026-11-19 11:26:02'),('50000000-0000-4000-8000-000000000108','30000000-0000-4000-8000-000000000101','Eyebrows + Upper lip',NULL,79.00,15,'[\"Verified professional\",\"Standard warranty\"]',1,7,'2026-11-19 08:51:46','2026-11-19 11:26:02'),('50000000-0000-4000-8000-000000000121','30000000-0000-4000-8000-000000000103','1 Split AC foam jet',NULL,599.00,60,'[\"Verified professional\",\"Standard warranty\"]',1,0,'2026-11-19 08:51:46','2026-11-19 11:26:02'),('50000000-0000-4000-8000-000000000122','30000000-0000-4000-8000-000000000103','2 Split AC foam jet',NULL,1099.00,120,'[\"Verified professional\",\"Standard warranty\"]',1,1,'2026-11-19 08:51:46','2026-11-19 11:26:02'),('50000000-0000-4000-8000-000000000123','30000000-0000-4000-8000-000000000103','3 Split AC foam jet',NULL,1599.00,180,'[\"Verified professional\",\"Standard warranty\"]',1,2,'2026-11-19 08:51:46','2026-11-19 11:26:02'),('50000000-0000-4000-8000-000000000124','30000000-0000-4000-8000-000000000103','1 Window AC foam jet',NULL,499.00,60,'[\"Verified professional\",\"Standard warranty\"]',1,3,'2026-11-19 08:51:46','2026-11-19 11:26:02'),('50000000-0000-4000-8000-000000000125','30000000-0000-4000-8000-000000000103','Anti-rust protective coating',NULL,299.00,30,'[\"Verified professional\",\"Standard warranty\"]',1,4,'2026-11-19 08:51:46','2026-11-19 11:26:02'),('50000000-0000-4000-8000-000000000126','30000000-0000-4000-8000-000000000103','Gas check & top-up',NULL,899.00,45,'[\"Verified professional\",\"Standard warranty\"]',1,5,'2026-11-19 08:51:46','2026-11-19 11:26:02'),('50000000-0000-4000-8000-000000000127','30000000-0000-4000-8000-000000000103','Drain pipe leak repair',NULL,349.00,30,'[\"Verified professional\",\"Standard warranty\"]',1,6,'2026-11-19 08:51:46','2026-11-19 11:26:02'),('50000000-0000-4000-8000-000000000128','30000000-0000-4000-8000-000000000103','Indoor master PCB overhaul',NULL,699.00,60,'[\"Verified professional\",\"Standard warranty\"]',1,7,'2026-11-19 08:51:46','2026-11-19 11:26:02'),('50000000-0000-4000-8000-000000000129','30000000-0000-4000-8000-000000000103','Full system health diagnostic',NULL,199.00,30,'[\"Verified professional\",\"Standard warranty\"]',1,8,'2026-11-19 08:51:46','2026-11-19 11:26:02');
/*!40000 ALTER TABLE `service_packages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_pricing_rules`
--

DROP TABLE IF EXISTS `service_pricing_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `service_pricing_rules` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `service_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `city_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `area_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `adjustment_type` enum('fixed','percentage','multiplier') NOT NULL,
  `adjustment_value` decimal(10,2) NOT NULL,
  `priority` int(11) NOT NULL DEFAULT 0,
  `starts_at` datetime DEFAULT NULL,
  `ends_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `area_id` (`area_id`),
  KEY `service_pricing_rules_service_id_is_active_priority` (`service_id`,`is_active`,`priority`),
  KEY `service_pricing_rules_city_id_area_id_is_active` (`city_id`,`area_id`,`is_active`),
  KEY `service_pricing_rules_starts_at_ends_at` (`starts_at`,`ends_at`),
  CONSTRAINT `service_pricing_rules_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `service_pricing_rules_ibfk_2` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `service_pricing_rules_ibfk_3` FOREIGN KEY (`area_id`) REFERENCES `areas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_pricing_rules`
--

LOCK TABLES `service_pricing_rules` WRITE;
/*!40000 ALTER TABLE `service_pricing_rules` DISABLE KEYS */;
/*!40000 ALTER TABLE `service_pricing_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `services`
--

DROP TABLE IF EXISTS `services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `services` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `category_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(140) NOT NULL,
  `slug` varchar(160) NOT NULL,
  `description` text DEFAULT NULL,
  `base_price` decimal(10,2) NOT NULL,
  `duration_minutes` int(11) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `short_description` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `services_category_id_is_active` (`category_id`,`is_active`),
  KEY `services_is_active_name` (`is_active`,`name`),
  CONSTRAINT `services_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `service_categories` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `services`
--

LOCK TABLES `services` WRITE;
/*!40000 ALTER TABLE `services` DISABLE KEYS */;
INSERT INTO `services` VALUES ('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Standard home cleaning','standard-home-cleaning','Routine cleaning for homes',49.00,120,1,'2026-11-19 05:21:28','2026-11-19 08:17:27',NULL),('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','Plumbing repair','plumbing-repair','General household plumbing repair',59.00,90,1,'2026-11-19 05:21:28','2026-11-19 08:17:27',NULL),('30000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000003','Electrical inspection','electrical-inspection','Basic household electrical inspection',69.00,60,1,'2026-11-19 05:21:28','2026-11-19 08:17:27',NULL),('30000000-0000-4000-8000-000000000011','20000000-0000-4000-8000-000000000011','Full home deep cleaning (2 BHK / 3 BHK)','full-home-deep-cleaning','Intense top-to-bottom scrub, sanitize, and vacuum for all rooms, kitchen, and bathrooms.',129.00,240,1,'2026-11-19 08:41:35','2026-11-19 11:26:02',NULL),('30000000-0000-4000-8000-000000000012','20000000-0000-4000-8000-000000000012','Acoustic fluted wood panel accent wall','acoustic-fluted-wood-wall','Contemporary vertical wooden slats with LED ambient backlit profiles for TV consoles.',249.00,360,1,'2026-11-19 08:41:35','2026-11-19 11:26:02',NULL),('30000000-0000-4000-8000-000000000013','20000000-0000-4000-8000-000000000013','Sofa shampooing & living room revitalizer','sofa-shampooing-living-cleaning','Multi-stage deep extraction shampooing for couches, cushions, and living room carpets.',69.00,90,1,'2026-11-19 08:41:35','2026-11-19 11:26:02',NULL),('30000000-0000-4000-8000-000000000014','20000000-0000-4000-8000-000000000014','Native M2 Smart RO+UV Water Purifier','native-m2-smart-water-purifier','10-stage purification with 2-year no-service-required filters and real-time app tracking.',189.00,60,1,'2026-11-19 08:41:35','2026-11-19 11:26:02',NULL),('30000000-0000-4000-8000-000000000015','20000000-0000-4000-8000-000000000015','Native 3D Face ID Smart Door Lock','native-3d-face-id-smart-lock','Biometric facial scan, fingerprint, NFC keycard, and mobile app door access.',219.00,90,1,'2026-11-19 08:41:35','2026-11-19 11:26:02',NULL),('30000000-0000-4000-8000-000000000101','4b8191ee-c708-4a76-a5d2-81ff8f00e19d','Threading','threading','Precise and gentle eyebrow and facial hair removal using organic cotton thread.',49.00,10,1,'2026-11-19 08:50:43','2026-11-19 11:26:02',NULL),('30000000-0000-4000-8000-000000000102','20000000-0000-4000-8000-000000000001','Intense cleaning (2 bathroom)','intense-cleaning-2-bathroom','Machine scrubbing for tiles, hard water stain removal, disinfection of toilet and fittings.',918.00,60,1,'2026-11-19 08:50:43','2026-11-19 11:26:02',NULL),('30000000-0000-4000-8000-000000000103','20000000-0000-4000-8000-000000000003','Foam-jet AC service','foam-jet-ac-service','High-pressure 2X deeper foam jet cleaning of indoor cooling coils and outdoor unit.',599.00,60,1,'2026-11-19 08:50:43','2026-11-19 11:26:02',NULL),('30000000-0000-4000-8000-000000000104','20000000-0000-4000-8000-000000000013','Fabric sofa cleaning','fabric-sofa-cleaning','Deep vacuuming, industrial foam shampooing, and wet extraction for fabric sofas.',399.00,45,1,'2026-11-19 08:50:43','2026-11-19 11:26:02',NULL),('30000000-0000-4000-8000-000000000105','20000000-0000-4000-8000-000000000011','Furnished apartment - Home deep cleaning','furnished-apartment-home-deep-cleaning','Full house top-to-bottom mechanized cleaning with floor scrubbing and kitchen degreasing.',3499.00,225,1,'2026-11-19 08:50:43','2026-11-19 11:26:02',NULL),('6fa5a8a0-7449-4e92-b8cb-303adffac575','4b8191ee-c708-4a76-a5d2-81ff8f00e19d','Hair cutting','hair-cutting','xftgjnyf',200.00,60,1,'2026-11-19 06:53:03','2026-11-19 06:53:03','Hair cut');
/*!40000 ALTER TABLE `services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `system_settings` (
  `id` char(36) NOT NULL,
  `key` varchar(64) NOT NULL,
  `value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`value`)),
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
INSERT INTO `system_settings` VALUES ('10000000-0000-4000-8000-000000000001','general','{\"siteName\":\"UrbanMate Verified\",\"siteTitle\":\"UrbanMate - On-Demand Doorstep Home & Salon Services\",\"metaDescription\":\"UrbanMate connects you with verified local professionals for cleaning, repair, salon, and handyman services across your city.\",\"metaKeywords\":\"cleaning, repair, plumbing\",\"headerScripts\":\"\",\"bodyScripts\":\"\",\"logoUrl\":\"\",\"faviconUrl\":\"\"}','2026-11-19 11:26:03','2026-11-19 13:19:08'),('10000000-0000-4000-8000-000000000002','payment','{\"mode\":\"test\",\"razorpayEnabled\":true,\"razorpayKeyId\":\"rzp_test_sample123\",\"razorpayKeySecret\":\"\",\"razorpayWebhookSecret\":\"\",\"upiEnabled\":true,\"upiId\":\"urbanmate@upi\",\"upiPayeeName\":\"UrbanMate Marketplace\",\"upiQrUrl\":\"\",\"upiInstructions\":\"Scan QR using any UPI app (GPay, PhonePe, Paytm). Confirm payment and note your transaction ID.\",\"codEnabled\":true}','2026-11-19 11:26:03','2026-11-19 13:19:08'),('10000000-0000-4000-8000-000000000003','mail','{\"enabled\":false,\"host\":\"smtp.gmail.com\",\"port\":587,\"secure\":false,\"encryption\":\"tls\",\"user\":\"\",\"password\":\"\",\"fromEmail\":\"noreply@urbanmate.in\",\"fromName\":\"UrbanMate Team\"}','2026-11-19 11:26:03','2026-11-19 11:26:03');
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_roles` (
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `role_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `user_roles_role_id` (`role_id`),
  CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `user_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES ('09d612e0-c87f-4b01-8797-57c98550fc8c','10000000-0000-4000-8000-000000000003','2026-11-19 05:23:38','2026-11-19 05:23:38'),('12d19aa5-638f-4d19-950a-f6e303ce8068','10000000-0000-4000-8000-000000000002','2026-11-19 05:25:27','2026-11-19 05:25:27'),('250c8039-0b58-4853-9d73-b451fe5b38ee','10000000-0000-4000-8000-000000000002','2026-11-19 05:49:58','2026-11-19 05:49:58'),('2dd33377-64d5-40ba-a205-ea8c51b784ef','10000000-0000-4000-8000-000000000002','2026-11-19 05:36:40','2026-11-19 05:36:40'),('b769ee4b-5f63-4e78-b0c1-af64ab8fd0ba','10000000-0000-4000-8000-000000000002','2026-11-19 05:54:25','2026-11-19 05:54:25'),('c0492ac0-b678-4ebf-a734-2c9e01d679aa','10000000-0000-4000-8000-000000000003','2026-11-19 05:33:37','2026-11-19 05:33:37'),('c332acaf-d18d-4d9b-a3fa-305ad017c601','10000000-0000-4000-8000-000000000001','2026-11-19 05:25:27','2026-11-19 05:25:27'),('d41d50cb-f792-4a0e-8346-63ee4b5b909b','10000000-0000-4000-8000-000000000001','2026-11-19 05:26:37','2026-11-19 05:26:37'),('ef74ccdf-a0da-41a7-9410-fbc5cabdcb4c','10000000-0000-4000-8000-000000000003','2026-11-19 05:23:52','2026-11-19 05:23:52'),('ffd5bfe2-80f3-4d1c-b099-0ec7ddee7394','10000000-0000-4000-8000-000000000003','2026-11-19 05:34:18','2026-11-19 05:34:18');
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `full_name` varchar(120) NOT NULL,
  `email` varchar(254) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `status` enum('active','pending','suspended','deleted') NOT NULL DEFAULT 'active',
  `email_verified_at` datetime DEFAULT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `auth_version` int(10) unsigned NOT NULL DEFAULT 0,
  `avatar_url` varchar(2048) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `phone` (`phone`),
  KEY `users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('09d612e0-c87f-4b01-8797-57c98550fc8c','Platform Administrator','admin@urbanmate.com',NULL,'$2a$10$l49Z7YBYKFGpBdKXe6yB9eXRszsLXRIDZDckKQrpSL8GOdXSD1mIK','active','2026-11-19 05:41:14','2026-11-19 11:30:14','2026-11-19 05:23:38','2026-11-19 11:30:14',0,NULL),('12d19aa5-638f-4d19-950a-f6e303ce8068','Jane Plumber','jane@example.com',NULL,'$2a$12$V3S2tIsJWvyKNhE0DWGg2OBE0AqjoETjmYO0uOkUWlpncyOHWEd0K','active','2026-11-19 05:41:14','2026-11-19 05:25:36','2026-11-19 05:25:27','2026-11-19 08:56:10',0,NULL),('250c8039-0b58-4853-9d73-b451fe5b38ee','provider2','provider2@gmail.com','342465464566','$2a$12$ARINw6urpGTlpxhMLtBUgugxpPSZHPpVHvnQWjpu.apJH7kn7ivQ.','active','2026-11-19 05:56:10','2026-11-19 08:56:41','2026-11-19 05:49:58','2026-11-19 08:56:41',0,NULL),('2dd33377-64d5-40ba-a205-ea8c51b784ef','Provider','provider@gmail.com','9876543210','$2a$12$1nrf6/350LE8uhOZcIcT/uMulJvqjNMeNy/Btd.ZoEEKQ4uypH8vi','active','2026-11-19 05:41:14','2026-11-19 05:48:03','2026-11-19 05:36:40','2026-11-19 05:48:03',0,NULL),('b769ee4b-5f63-4e78-b0c1-af64ab8fd0ba','Bob Smith','bob@example.com',NULL,'$2a$12$n3.U3fVKO9GNybKAWgbvluwsCfpxIlxE5lRQUL67RSRvWuo8Ughay','active','2026-11-19 05:54:36',NULL,'2026-11-19 05:54:24','2026-11-19 05:54:36',0,NULL),('c0492ac0-b678-4ebf-a734-2c9e01d679aa','Admin Short','shortadmin@urbanmate.com',NULL,'$2a$12$bprp3/ak3PCtJNxrFIhzN.6qrMSOfeVVC789/C4/8noWbEllATAxy','active','2026-11-19 05:41:14','2026-11-19 05:33:44','2026-11-19 05:33:37','2026-11-19 05:41:14',0,NULL),('c332acaf-d18d-4d9b-a3fa-305ad017c601','John Doe','john@example.com',NULL,'$2a$12$1L0aXLXC3EETyYQ2EtC3uu8D0KJOI/ibIIxATicxNeCGAeczyALu6','active','2026-11-19 05:41:14','2026-11-19 05:25:36','2026-11-19 05:25:27','2026-11-19 08:56:08',0,NULL),('d41d50cb-f792-4a0e-8346-63ee4b5b909b','Rajeev Aggarwal','rocketremitt@gmail.com',NULL,'$2a$12$QBIdJnZ1lPVCJ9QTdVK1KeUCgX/SdQ0Khpiwv2SxbBAIETNVvH.oW','active','2026-11-19 05:41:14','2026-11-19 12:44:31','2026-11-19 05:26:37','2026-11-19 12:47:22',0,'/uploads/avatar_d41d50cb-f792-4a0e-8346-63ee4b5b909b_1795092442414.png'),('ef74ccdf-a0da-41a7-9410-fbc5cabdcb4c','Second Admin','admin2@urbanmate.com',NULL,'$2a$12$9kSIVmvkMcK9.VcrBOoWRuZEW6Dt4bCTRb1q3cTJvxQER.hona/H6','active','2026-11-19 05:41:14',NULL,'2026-11-19 05:23:52','2026-11-19 05:41:14',0,NULL),('ffd5bfe2-80f3-4d1c-b099-0ec7ddee7394','Platform Administrator','admin@gmail.com',NULL,'$2a$12$QDhsbC/6fujPr4WuDGPRhOe8kj2cOi4ooFJHpQa2zi.EnaQHFdOzi','active','2026-11-19 05:41:14','2026-11-19 12:57:13','2026-11-19 05:34:18','2026-11-19 12:57:13',0,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-20 10:26:00
