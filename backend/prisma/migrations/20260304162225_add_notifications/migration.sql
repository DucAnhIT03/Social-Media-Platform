/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `messages` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `messages` DROP FOREIGN KEY `messages_senderId_fkey`;

-- DropIndex
DROP INDEX `messages_deletedAt_idx` ON `messages`;

-- DropIndex
DROP INDEX `messages_senderId_createdAt_idx` ON `messages`;

-- AlterTable
ALTER TABLE `messages` DROP COLUMN `deletedAt`,
    ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `type` ENUM('TEXT', 'IMAGE', 'VIDEO', 'FILE') NOT NULL DEFAULT 'TEXT';

-- CreateTable
CREATE TABLE `notifications` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `fromUserId` CHAR(36) NOT NULL,
    `type` ENUM('FRIEND_REQUEST') NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `readAt` DATETIME(3) NULL,

    INDEX `notifications_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `messages_senderId_idx` ON `messages`(`senderId`);

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_fromUserId_fkey` FOREIGN KEY (`fromUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
