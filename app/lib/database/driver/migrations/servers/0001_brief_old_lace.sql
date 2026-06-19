PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_servers_history` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`username` text,
	`updated_at` real NOT NULL,
	`icon_url` text
);
--> statement-breakpoint
INSERT INTO `__new_servers_history`("id", "url", "username", "updated_at", "icon_url") SELECT "id", "url", "username", "updated_at", "icon_url" FROM `servers_history`;--> statement-breakpoint
DROP TABLE `servers_history`;--> statement-breakpoint
ALTER TABLE `__new_servers_history` RENAME TO `servers_history`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `servers_history_url_idx` ON `servers_history` (`url`);