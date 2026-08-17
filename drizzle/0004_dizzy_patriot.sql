CREATE TABLE `ml_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(255) NOT NULL,
	`accessToken` text NOT NULL,
	`refreshToken` text,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ml_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `ml_tokens_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE INDEX `ml_tokens_userId_idx` ON `ml_tokens` (`userId`);