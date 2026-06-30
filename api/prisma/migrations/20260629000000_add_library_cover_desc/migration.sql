-- AlterTable: add coverUrl and descAr to library_assets
ALTER TABLE `library_assets` ADD COLUMN `coverUrl` VARCHAR(191) NULL;
ALTER TABLE `library_assets` ADD COLUMN `descAr` TEXT NULL;
