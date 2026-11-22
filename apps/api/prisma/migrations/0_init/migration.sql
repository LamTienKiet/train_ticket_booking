-- CreateTable
CREATE TABLE `accounts` (
    `id` CHAR(36) NOT NULL,
    `username` VARCHAR(50) NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('CUSTOMER', 'STAFF', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER',
    `status` ENUM('ACTIVE', 'INACTIVE', 'BANNED') NOT NULL DEFAULT 'ACTIVE',
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `accounts_username_key`(`username`),
    UNIQUE INDEX `accounts_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `account_id` CHAR(36) NOT NULL,
    `full_name` VARCHAR(150) NULL,
    `phone` VARCHAR(20) NULL,
    `avatar` VARCHAR(255) NULL,
    `birthday` DATE NULL,
    `gender` VARCHAR(20) NULL,
    `address` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_account_id_key`(`account_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` CHAR(36) NOT NULL,
    `account_id` CHAR(36) NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `refresh_tokens_token_hash_key`(`token_hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stations` (
    `id` CHAR(36) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `address` VARCHAR(255) NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `stations_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `routes` (
    `id` CHAR(36) NOT NULL,
    `code` VARCHAR(30) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `origin_station_id` CHAR(36) NOT NULL,
    `destination_station_id` CHAR(36) NOT NULL,
    `distance_km` DECIMAL(8, 2) NULL,
    `estimated_duration_minutes` INTEGER NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `routes_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `route_stations` (
    `id` CHAR(36) NOT NULL,
    `route_id` CHAR(36) NOT NULL,
    `station_id` CHAR(36) NOT NULL,
    `stop_order` INTEGER NOT NULL,
    `arrival_offset_minutes` INTEGER NOT NULL,
    `departure_offset_minutes` INTEGER NOT NULL,

    UNIQUE INDEX `route_stations_route_id_station_id_key`(`route_id`, `station_id`),
    UNIQUE INDEX `route_stations_route_id_stop_order_key`(`route_id`, `stop_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trains` (
    `id` CHAR(36) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `trains_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seat_types` (
    `id` CHAR(36) NOT NULL,
    `code` VARCHAR(30) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NULL,
    `price_multiplier` DECIMAL(5, 2) NOT NULL DEFAULT 1.00,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `seat_types_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coaches` (
    `id` CHAR(36) NOT NULL,
    `train_id` CHAR(36) NOT NULL,
    `coach_number` INTEGER NOT NULL,
    `coach_type` ENUM('SEATING', 'SLEEPER', 'RESTAURANT', 'SERVICE') NOT NULL,
    `capacity` INTEGER NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `coaches_train_id_coach_number_key`(`train_id`, `coach_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seats` (
    `id` CHAR(36) NOT NULL,
    `coach_id` CHAR(36) NOT NULL,
    `seat_type_id` CHAR(36) NOT NULL,
    `seat_number` VARCHAR(20) NOT NULL,
    `floor_number` INTEGER NULL,
    `position` VARCHAR(30) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `seats_coach_id_seat_number_key`(`coach_id`, `seat_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trips` (
    `id` CHAR(36) NOT NULL,
    `trip_code` VARCHAR(50) NOT NULL,
    `route_id` CHAR(36) NOT NULL,
    `train_id` CHAR(36) NOT NULL,
    `departure_time` DATETIME(3) NOT NULL,
    `arrival_time` DATETIME(3) NOT NULL,
    `status` ENUM('SCHEDULED', 'BOARDING', 'DEPARTED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `trips_trip_code_key`(`trip_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trip_stations` (
    `id` CHAR(36) NOT NULL,
    `trip_id` CHAR(36) NOT NULL,
    `station_id` CHAR(36) NOT NULL,
    `stop_order` INTEGER NOT NULL,
    `arrival_time` DATETIME(3) NULL,
    `departure_time` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `trip_stations_trip_id_station_id_key`(`trip_id`, `station_id`),
    UNIQUE INDEX `trip_stations_trip_id_stop_order_key`(`trip_id`, `stop_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fare_rules` (
    `id` CHAR(36) NOT NULL,
    `route_id` CHAR(36) NOT NULL,
    `seat_type_id` CHAR(36) NOT NULL,
    `base_price` DECIMAL(12, 2) NOT NULL,
    `min_distance_km` DECIMAL(8, 2) NULL,
    `max_distance_km` DECIMAL(8, 2) NULL,
    `effective_from` DATETIME(3) NOT NULL,
    `effective_to` DATETIME(3) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `passenger_fare_rules` (
    `id` CHAR(36) NOT NULL,
    `fare_rule_id` CHAR(36) NOT NULL,
    `passenger_type` ENUM('ADULT', 'CHILD', 'STUDENT', 'SENIOR', 'INFANT') NOT NULL,
    `discount_percent` DECIMAL(5, 2) NOT NULL DEFAULT 0,

    UNIQUE INDEX `passenger_fare_rules_fare_rule_id_passenger_type_key`(`fare_rule_id`, `passenger_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bookings` (
    `id` CHAR(36) NOT NULL,
    `booking_code` VARCHAR(30) NOT NULL,
    `user_id` CHAR(36) NULL,
    `trip_id` CHAR(36) NOT NULL,
    `contact_name` VARCHAR(150) NULL,
    `contact_phone` VARCHAR(20) NULL,
    `contact_email` VARCHAR(255) NULL,
    `subtotal_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `discount_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `status` ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    `expires_at` DATETIME(3) NULL,
    `confirmed_at` DATETIME(3) NULL,
    `cancelled_at` DATETIME(3) NULL,
    `completed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `bookings_booking_code_key`(`booking_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `passengers` (
    `id` CHAR(36) NOT NULL,
    `booking_id` CHAR(36) NOT NULL,
    `full_name` VARCHAR(150) NOT NULL,
    `id_number` VARCHAR(50) NOT NULL,
    `date_of_birth` DATE NULL,
    `phone` VARCHAR(20) NULL,
    `email` VARCHAR(255) NULL,
    `passenger_type` ENUM('ADULT', 'CHILD', 'STUDENT', 'SENIOR', 'INFANT') NOT NULL DEFAULT 'ADULT',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `booking_seats` (
    `id` CHAR(36) NOT NULL,
    `booking_id` CHAR(36) NOT NULL,
    `passenger_id` CHAR(36) NOT NULL,
    `seat_id` CHAR(36) NOT NULL,
    `origin_station_id` CHAR(36) NOT NULL,
    `destination_station_id` CHAR(36) NOT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('HELD', 'CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'HELD',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coupons` (
    `id` CHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `description` VARCHAR(255) NULL,
    `discount_type` ENUM('PERCENTAGE', 'FIXED') NOT NULL,
    `discount_value` DECIMAL(12, 2) NOT NULL,
    `min_order_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `max_discount_amount` DECIMAL(12, 2) NULL,
    `usage_limit` INTEGER NULL,
    `used_count` INTEGER NOT NULL DEFAULT 0,
    `starts_at` DATETIME(3) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `coupons_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `booking_coupons` (
    `id` CHAR(36) NOT NULL,
    `booking_id` CHAR(36) NOT NULL,
    `coupon_id` CHAR(36) NOT NULL,
    `discount_amount` DECIMAL(12, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `booking_coupons_booking_id_coupon_id_key`(`booking_id`, `coupon_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` CHAR(36) NOT NULL,
    `booking_id` CHAR(36) NOT NULL,
    `payment_code` VARCHAR(50) NOT NULL,
    `provider` ENUM('MOCK', 'VNPAY', 'STRIPE') NOT NULL DEFAULT 'MOCK',
    `payment_method` VARCHAR(50) NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `transaction_id` VARCHAR(100) NULL,
    `idempotency_key` VARCHAR(100) NOT NULL,
    `paid_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `payments_booking_id_key`(`booking_id`),
    UNIQUE INDEX `payments_payment_code_key`(`payment_code`),
    UNIQUE INDEX `payments_idempotency_key_key`(`idempotency_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refunds` (
    `id` CHAR(36) NOT NULL,
    `payment_id` CHAR(36) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `reason` VARCHAR(255) NULL,
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `provider_refund_id` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processed_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ticket_issues` (
    `id` CHAR(36) NOT NULL,
    `booking_seat_id` CHAR(36) NOT NULL,
    `ticket_number` VARCHAR(50) NOT NULL,
    `qr_code` VARCHAR(255) NOT NULL,
    `issued_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('ACTIVE', 'USED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `used_at` DATETIME(3) NULL,

    UNIQUE INDEX `ticket_issues_booking_seat_id_key`(`booking_seat_id`),
    UNIQUE INDEX `ticket_issues_ticket_number_key`(`ticket_number`),
    UNIQUE INDEX `ticket_issues_qr_code_key`(`qr_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `boarding_records` (
    `id` CHAR(36) NOT NULL,
    `ticket_id` CHAR(36) NOT NULL,
    `station_id` CHAR(36) NOT NULL,
    `checked_by` CHAR(36) NULL,
    `checked_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('BOARDED', 'REJECTED') NOT NULL,
    `note` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reviews` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `booking_id` CHAR(36) NOT NULL,
    `train_id` CHAR(36) NOT NULL,
    `rating` TINYINT NOT NULL,
    `comment` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `reviews_user_id_booking_id_key`(`user_id`, `booking_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `message` TEXT NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `read_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` CHAR(36) NOT NULL,
    `account_id` CHAR(36) NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `entity_id` CHAR(36) NULL,
    `old_data` JSON NULL,
    `new_data` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `booking_status_histories` (
    `id` CHAR(36) NOT NULL,
    `booking_id` CHAR(36) NOT NULL,
    `old_status` ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED', 'COMPLETED') NULL,
    `new_status` ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED', 'COMPLETED') NOT NULL,
    `changed_by` CHAR(36) NULL,
    `reason` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `routes` ADD CONSTRAINT `routes_origin_station_id_fkey` FOREIGN KEY (`origin_station_id`) REFERENCES `stations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `routes` ADD CONSTRAINT `routes_destination_station_id_fkey` FOREIGN KEY (`destination_station_id`) REFERENCES `stations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `route_stations` ADD CONSTRAINT `route_stations_route_id_fkey` FOREIGN KEY (`route_id`) REFERENCES `routes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `route_stations` ADD CONSTRAINT `route_stations_station_id_fkey` FOREIGN KEY (`station_id`) REFERENCES `stations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coaches` ADD CONSTRAINT `coaches_train_id_fkey` FOREIGN KEY (`train_id`) REFERENCES `trains`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seats` ADD CONSTRAINT `seats_coach_id_fkey` FOREIGN KEY (`coach_id`) REFERENCES `coaches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seats` ADD CONSTRAINT `seats_seat_type_id_fkey` FOREIGN KEY (`seat_type_id`) REFERENCES `seat_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trips` ADD CONSTRAINT `trips_route_id_fkey` FOREIGN KEY (`route_id`) REFERENCES `routes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trips` ADD CONSTRAINT `trips_train_id_fkey` FOREIGN KEY (`train_id`) REFERENCES `trains`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trip_stations` ADD CONSTRAINT `trip_stations_trip_id_fkey` FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trip_stations` ADD CONSTRAINT `trip_stations_station_id_fkey` FOREIGN KEY (`station_id`) REFERENCES `stations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fare_rules` ADD CONSTRAINT `fare_rules_route_id_fkey` FOREIGN KEY (`route_id`) REFERENCES `routes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fare_rules` ADD CONSTRAINT `fare_rules_seat_type_id_fkey` FOREIGN KEY (`seat_type_id`) REFERENCES `seat_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `passenger_fare_rules` ADD CONSTRAINT `passenger_fare_rules_fare_rule_id_fkey` FOREIGN KEY (`fare_rule_id`) REFERENCES `fare_rules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_trip_id_fkey` FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `passengers` ADD CONSTRAINT `passengers_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking_seats` ADD CONSTRAINT `booking_seats_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking_seats` ADD CONSTRAINT `booking_seats_passenger_id_fkey` FOREIGN KEY (`passenger_id`) REFERENCES `passengers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking_seats` ADD CONSTRAINT `booking_seats_seat_id_fkey` FOREIGN KEY (`seat_id`) REFERENCES `seats`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking_seats` ADD CONSTRAINT `booking_seats_origin_station_id_fkey` FOREIGN KEY (`origin_station_id`) REFERENCES `stations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking_seats` ADD CONSTRAINT `booking_seats_destination_station_id_fkey` FOREIGN KEY (`destination_station_id`) REFERENCES `stations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking_coupons` ADD CONSTRAINT `booking_coupons_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking_coupons` ADD CONSTRAINT `booking_coupons_coupon_id_fkey` FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refunds` ADD CONSTRAINT `refunds_payment_id_fkey` FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket_issues` ADD CONSTRAINT `ticket_issues_booking_seat_id_fkey` FOREIGN KEY (`booking_seat_id`) REFERENCES `booking_seats`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `boarding_records` ADD CONSTRAINT `boarding_records_ticket_id_fkey` FOREIGN KEY (`ticket_id`) REFERENCES `ticket_issues`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `boarding_records` ADD CONSTRAINT `boarding_records_station_id_fkey` FOREIGN KEY (`station_id`) REFERENCES `stations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `boarding_records` ADD CONSTRAINT `boarding_records_checked_by_fkey` FOREIGN KEY (`checked_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_train_id_fkey` FOREIGN KEY (`train_id`) REFERENCES `trains`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking_status_histories` ADD CONSTRAINT `booking_status_histories_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking_status_histories` ADD CONSTRAINT `booking_status_histories_changed_by_fkey` FOREIGN KEY (`changed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

