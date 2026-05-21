-- =====================================================================
-- PetChain 스키마 baseline (참조용 스냅샷)
--
-- 이 파일은 dev MySQL(petchain)에서 mysqldump --no-data 로 추출한
-- 현재 스키마 스냅샷이다. 런타임의 실제 스키마는 Hibernate
-- ddl-auto=update 가 엔티티 기준으로 생성/갱신하므로, 이 파일은
-- "정본"이 아니라 다음 용도의 참조 산출물이다.
--   1) AWS/신규 환경에서 빈 DB에 스키마를 수동 적재해야 할 때
--   2) prod 프로파일(ddl-auto=validate)로 띄우기 전 스키마 확정 검토
--   3) ERD/엔티티 변경 리뷰 시 실제 DDL 대조
--
-- 엔티티를 변경했다면 dev DB를 ddl-auto=update 로 한 번 기동한 뒤
-- 이 파일을 재생성할 것:
--   mysqldump -uroot -p --no-data --skip-dump-date --no-tablespaces \
--     --default-character-set=utf8mb4 petchain > db/schema.sql
-- =====================================================================
-- MySQL dump 10.13  Distrib 8.4.9, for Win64 (x86_64)
--
-- Host: localhost    Database: petchain
-- ------------------------------------------------------
-- Server version	8.4.9

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `after_data` json DEFAULT NULL,
  `before_data` json DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `fabric_tx_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_id` bigint DEFAULT NULL,
  `target_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKjs4iimve3y0xssbtve5ysyef0` (`user_id`),
  CONSTRAINT `FKjs4iimve3y0xssbtve5ysyef0` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `claim_packages`
--

DROP TABLE IF EXISTS `claim_packages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `claim_packages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `claim_id` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `claim_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `consent_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `consented_at` datetime(6) DEFAULT NULL,
  `fabric_tx_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `review_note` mediumtext COLLATE utf8mb4_unicode_ci,
  `review_result` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reviewed_at` datetime(6) DEFAULT NULL,
  `verified_at` datetime(6) DEFAULT NULL,
  `verify_tx_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guardian_id` bigint NOT NULL,
  `insurance_company_id` bigint NOT NULL,
  `medical_record_id` bigint NOT NULL,
  `pet_insurance_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK9bejttcpddopquf83u0vtuvtr` (`medical_record_id`,`insurance_company_id`),
  UNIQUE KEY `UKq0gd0n53on071pwn1g0gd2b2k` (`claim_id`),
  KEY `FK6w84fk7vg8oj8j7gssj3rva4c` (`guardian_id`),
  KEY `FKm44lfnwd0rnbv83le6yw5k8yy` (`insurance_company_id`),
  KEY `FKq72d40po2f5uicjvl1ji59ylq` (`pet_insurance_id`),
  CONSTRAINT `FK2uj6bm5irjuto9nvhxtwxdasy` FOREIGN KEY (`medical_record_id`) REFERENCES `medical_records` (`id`),
  CONSTRAINT `FK6w84fk7vg8oj8j7gssj3rva4c` FOREIGN KEY (`guardian_id`) REFERENCES `guardians` (`id`),
  CONSTRAINT `FKm44lfnwd0rnbv83le6yw5k8yy` FOREIGN KEY (`insurance_company_id`) REFERENCES `insurance_companies` (`id`),
  CONSTRAINT `FKq72d40po2f5uicjvl1ji59ylq` FOREIGN KEY (`pet_insurance_id`) REFERENCES `pet_insurance` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `consent_history`
--

DROP TABLE IF EXISTS `consent_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consent_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `acted_at` datetime(6) NOT NULL,
  `action` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fabric_tx_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `previous_status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `claim_package_id` bigint NOT NULL,
  `guardian_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKg9qkayg4gjs4kw24i5u7flw4m` (`claim_package_id`),
  KEY `FK319c1eeglcdyx5211i73dakeh` (`guardian_id`),
  CONSTRAINT `FK319c1eeglcdyx5211i73dakeh` FOREIGN KEY (`guardian_id`) REFERENCES `guardians` (`id`),
  CONSTRAINT `FKg9qkayg4gjs4kw24i5u7flw4m` FOREIGN KEY (`claim_package_id`) REFERENCES `claim_packages` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `disease_codes`
--

DROP TABLE IF EXISTS `disease_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `disease_codes` (
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` bit(1) NOT NULL,
  `name_en` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name_ko` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `guardians`
--

DROP TABLE IF EXISTS `guardians`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guardians` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `address` mediumtext COLLATE utf8mb4_unicode_ci,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `identity_verified` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `member_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKfj9d0nnbmsnq8jej4ktd884jb` (`member_number`),
  UNIQUE KEY `UK7lxoxxlgy2vr78w6mfjf1joj4` (`user_id`),
  CONSTRAINT `FK5eumov3yj9478qog0kac3yfnn` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hospitals`
--

DROP TABLE IF EXISTS `hospitals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hospitals` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `address` mediumtext COLLATE utf8mb4_unicode_ci,
  `admin_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `business_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fabric_org_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` bit(1) NOT NULL,
  `member_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKafduheo3tnd55dd23i18bk13d` (`member_number`),
  UNIQUE KEY `UKl9i0cjxgymhdclmshrs4v9rbu` (`user_id`),
  UNIQUE KEY `UKlrpewfyufqdwf7plgvp59254j` (`business_number`),
  UNIQUE KEY `UKa8t31rf5e7ouog8n5127mlagu` (`fabric_org_id`),
  CONSTRAINT `FK6t8w2b6ev7lgub3tygdgshv3j` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `insurance_companies`
--

DROP TABLE IF EXISTS `insurance_companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `insurance_companies` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `admin_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `business_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fabric_org_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` bit(1) NOT NULL,
  `member_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKhry7lk9pru5kjrsnbn3s2h9d8` (`member_number`),
  UNIQUE KEY `UKs34s40hfxwe4cwgs9fplv2qm9` (`user_id`),
  UNIQUE KEY `UKdr129m0ig2xphdw3vj7irlpo2` (`business_number`),
  UNIQUE KEY `UKnxhb6foj1qg0ijjrijnv03een` (`fabric_org_id`),
  CONSTRAINT `FKmorb39tht03ce8nntxq1bosd5` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `medical_record_diseases`
--

DROP TABLE IF EXISTS `medical_record_diseases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_record_diseases` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `is_primary` bit(1) NOT NULL,
  `disease_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `medical_record_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKg9aqf42oh32u4nb1wuqnah5gx` (`medical_record_id`,`disease_code`),
  KEY `FK4ikrvlw0ci6ns7ned2s3h074n` (`disease_code`),
  CONSTRAINT `FK4ikrvlw0ci6ns7ned2s3h074n` FOREIGN KEY (`disease_code`) REFERENCES `disease_codes` (`code`),
  CONSTRAINT `FK69b8log2b129nuv3m4781nrax` FOREIGN KEY (`medical_record_id`) REFERENCES `medical_records` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `medical_record_files`
--

DROP TABLE IF EXISTS `medical_record_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_record_files` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `file_size` bigint DEFAULT NULL,
  `file_type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_deleted` bit(1) NOT NULL,
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `original_filename` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `s3_key` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploaded_at` datetime(6) NOT NULL,
  `medical_record_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK810wly1pukljelohxs79siv98` (`medical_record_id`),
  CONSTRAINT `FK810wly1pukljelohxs79siv98` FOREIGN KEY (`medical_record_id`) REFERENCES `medical_records` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `medical_record_treatments`
--

DROP TABLE IF EXISTS `medical_record_treatments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_record_treatments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `unit_cost` int DEFAULT NULL,
  `medical_record_id` bigint NOT NULL,
  `treatment_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKexv3jx8t9a0vimawcmafdmt9j` (`medical_record_id`,`treatment_code`),
  KEY `FKea2o05mllj0fvp3ss7ucehca1` (`treatment_code`),
  CONSTRAINT `FK6yywngqftwo89fl12c6n8e0i0` FOREIGN KEY (`medical_record_id`) REFERENCES `medical_records` (`id`),
  CONSTRAINT `FKea2o05mllj0fvp3ss7ucehca1` FOREIGN KEY (`treatment_code`) REFERENCES `treatment_codes` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `medical_records`
--

DROP TABLE IF EXISTS `medical_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_records` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `detail_data_hash` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fabric_tx_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `findings_encrypted` mediumtext COLLATE utf8mb4_unicode_ci,
  `on_chain_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prescription_encrypted` mediumtext COLLATE utf8mb4_unicode_ci,
  `record_id` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `test_results_encrypted` mediumtext COLLATE utf8mb4_unicode_ci,
  `total_cost` int NOT NULL,
  `treatment_date` date NOT NULL,
  `hospital_id` bigint NOT NULL,
  `pet_id` bigint NOT NULL,
  `intended_insurer_id` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `record_version` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKc0i7hmfnh567ofmo5vycmqy76` (`record_id`),
  KEY `FK5dpmubxo00mqy79pxdqg12qui` (`hospital_id`),
  KEY `FKojfodeedei8la4yhl5wfo99iy` (`pet_id`),
  CONSTRAINT `FK5dpmubxo00mqy79pxdqg12qui` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`),
  CONSTRAINT `FKojfodeedei8la4yhl5wfo99iy` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `nft_tokens`
--

DROP TABLE IF EXISTS `nft_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nft_tokens` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `claim_id` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `detail_hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fabric_tx_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `issued_at` datetime(6) NOT NULL,
  `issued_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `record_id` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `claim_package_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKa9287ab7jv1yy9t1lnks22pfw` (`token_id`),
  UNIQUE KEY `UK8df6pbeah2dggpv36kd8r6c2h` (`claim_package_id`),
  CONSTRAINT `FKrs8rouuuavq1lmtm5ko83dwa0` FOREIGN KEY (`claim_package_id`) REFERENCES `claim_packages` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pet_insurance`
--

DROP TABLE IF EXISTS `pet_insurance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pet_insurance` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `end_date` date DEFAULT NULL,
  `policy_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `guardian_id` bigint NOT NULL,
  `insurance_company_id` bigint NOT NULL,
  `pet_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKdn6g5elxu6bcpvd5kmeknv9gy` (`guardian_id`),
  KEY `FK5ws5j6ukjfli0idvd0hqhe872` (`insurance_company_id`),
  KEY `FKsyquoxdl6wqj0jdy8vy4d3omi` (`pet_id`),
  CONSTRAINT `FK5ws5j6ukjfli0idvd0hqhe872` FOREIGN KEY (`insurance_company_id`) REFERENCES `insurance_companies` (`id`),
  CONSTRAINT `FKdn6g5elxu6bcpvd5kmeknv9gy` FOREIGN KEY (`guardian_id`) REFERENCES `guardians` (`id`),
  CONSTRAINT `FKsyquoxdl6wqj0jdy8vy4d3omi` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pets`
--

DROP TABLE IF EXISTS `pets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pets` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `birth_year` int DEFAULT NULL,
  `breed` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_neutered` bit(1) DEFAULT NULL,
  `microchip_hash` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pet_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `registered_at` datetime(6) NOT NULL,
  `sbt_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sbt_token_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `species` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `guardian_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKo29018sm18w13j5hq79e68bki` (`pet_number`),
  UNIQUE KEY `UK71dtl7iv3f3e8xkjcrcqjy9qs` (`microchip_hash`),
  UNIQUE KEY `UKqsf5wow0m6v6wjqogfjkfuhtv` (`sbt_token_id`),
  KEY `FKlaom8jpue42byy7yl7why5mcw` (`guardian_id`),
  CONSTRAINT `FKlaom8jpue42byy7yl7why5mcw` FOREIGN KEY (`guardian_id`) REFERENCES `guardians` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `point_balances`
--

DROP TABLE IF EXISTS `point_balances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `point_balances` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `balance` int NOT NULL,
  `owner_id` bigint NOT NULL,
  `owner_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `version` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK4b5f614fe9ugqtg9dh470u393` (`owner_type`,`owner_id`),
  CONSTRAINT `point_balances_chk_1` CHECK ((`balance` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `point_transactions`
--

DROP TABLE IF EXISTS `point_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `point_transactions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `amount` int NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fabric_tx_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `from_owner_id` bigint DEFAULT NULL,
  `from_owner_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `to_owner_id` bigint DEFAULT NULL,
  `to_owner_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tx_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `related_claim_id` bigint DEFAULT NULL,
  `reversed_transaction_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKqoatnclbt9hium2d1ixangp3r` (`related_claim_id`),
  CONSTRAINT `FKqoatnclbt9hium2d1ixangp3r` FOREIGN KEY (`related_claim_id`) REFERENCES `claim_packages` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `post_comments`
--

DROP TABLE IF EXISTS `post_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_comments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_deleted` bit(1) NOT NULL,
  `author_id` bigint NOT NULL,
  `parent_comment_id` bigint DEFAULT NULL,
  `post_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_comments_post_root` (`post_id`,`parent_comment_id`,`is_deleted`,`created_at`),
  KEY `idx_comments_parent` (`parent_comment_id`,`is_deleted`,`created_at`),
  KEY `FK9uedrlupih4x9c9qk1ntwdpie` (`author_id`),
  CONSTRAINT `FK21q7y8a124im4g0l4aaxn4ol1` FOREIGN KEY (`parent_comment_id`) REFERENCES `post_comments` (`id`),
  CONSTRAINT `FK9uedrlupih4x9c9qk1ntwdpie` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKaawaqxjs3br8dw5v90w7uu514` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `post_images`
--

DROP TABLE IF EXISTS `post_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_images` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `display_order` int NOT NULL,
  `file_size` bigint DEFAULT NULL,
  `image_data` longtext COLLATE utf8mb4_unicode_ci,
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `original_filename` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `s3_key` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uploaded_at` datetime(6) NOT NULL,
  `post_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_post_images_post` (`post_id`,`display_order`),
  CONSTRAINT `FKo1i5va2d8de9mwq727vxh0s05` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `post_likes`
--

DROP TABLE IF EXISTS `post_likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_likes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `post_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK5l2rj28vw5oj6f7ox746grokg` (`post_id`,`user_id`),
  KEY `FKkgau5n0nlewg6o9lr4yibqgxj` (`user_id`),
  CONSTRAINT `FKa5wxsgl4doibhbed9gm7ikie2` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`),
  CONSTRAINT `FKkgau5n0nlewg6o9lr4yibqgxj` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `posts`
--

DROP TABLE IF EXISTS `posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `posts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `author_region` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_deleted` bit(1) NOT NULL,
  `pet_breed` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pet_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_posts_active_created` (`is_deleted`,`created_at`),
  KEY `idx_posts_region_created` (`author_region`,`is_deleted`,`created_at`),
  KEY `FK5lidm6cqbc7u4xhqpxm898qme` (`user_id`),
  CONSTRAINT `FK5lidm6cqbc7u4xhqpxm898qme` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `record_flags`
--

DROP TABLE IF EXISTS `record_flags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `record_flags` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `cost` int DEFAULT NULL,
  `disease` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hospital_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` mediumtext COLLATE utf8mb4_unicode_ci,
  `pet_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reason_code` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `record_id` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reported_by_insurer_id` bigint DEFAULT NULL,
  `resolve_code` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resolve_note` mediumtext COLLATE utf8mb4_unicode_ci,
  `resolved_at` datetime(6) DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `verification_id` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refresh_tokens` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `device_info` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expires_at` datetime(6) NOT NULL,
  `is_revoked` bit(1) NOT NULL,
  `token_hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKo2mlirhldriil2y7krapq4frt` (`token_hash`),
  KEY `FK1lih5y2npsf8u5o3vhdb9y0os` (`user_id`),
  CONSTRAINT `FK1lih5y2npsf8u5o3vhdb9y0os` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `treatment_codes`
--

DROP TABLE IF EXISTS `treatment_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `treatment_codes` (
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` bit(1) NOT NULL,
  `name_en` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name_ko` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `last_login_at` datetime(6) DEFAULT NULL,
  `login_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `member_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `oauth_provider` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `oauth_provider_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKi3xs7wmfu2i3jt079uuetycit` (`login_id`),
  UNIQUE KEY `uq_users_oauth` (`oauth_provider`,`oauth_provider_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `verification_logs`
--

DROP TABLE IF EXISTS `verification_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `verification_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `fabric_tx_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `points_spent` int NOT NULL,
  `requested_at` datetime(6) NOT NULL,
  `requested_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `result` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `claim_package_id` bigint NOT NULL,
  `insurance_company_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKfksk3v69xcucsjxxb8whpw3l0` (`claim_package_id`),
  KEY `FK6ryhl4y6w9hhhe4x77p5f3s3a` (`insurance_company_id`),
  CONSTRAINT `FK6ryhl4y6w9hhhe4x77p5f3s3a` FOREIGN KEY (`insurance_company_id`) REFERENCES `insurance_companies` (`id`),
  CONSTRAINT `FKfksk3v69xcucsjxxb8whpw3l0` FOREIGN KEY (`claim_package_id`) REFERENCES `claim_packages` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed
