CREATE TABLE `servers_history` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`username` text,
	`updated_at` real NOT NULL,
	`icon_url` text
);
--> statement-breakpoint
CREATE INDEX `servers_history_url_idx` ON `servers_history` (`url`);--> statement-breakpoint
CREATE TABLE `servers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`icon_url` text,
	`use_real_name` integer,
	`file_upload_media_type_white_list` text,
	`file_upload_max_file_size` real,
	`rooms_updated_at` real,
	`version` text,
	`last_local_authenticated_session` real,
	`auto_lock` integer,
	`auto_lock_time` real,
	`biometry` integer,
	`unique_id` text,
	`enterprise_modules` text,
	`e2e_enable` integer,
	`supported_versions` text,
	`supported_versions_warning_at` real,
	`supported_versions_updated_at` real
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text,
	`username` text,
	`name` text,
	`language` text,
	`status` text,
	`statusText` text,
	`roles` text,
	`login_email_password` integer,
	`show_message_in_main_thread` integer,
	`avatar_etag` text,
	`is_from_webview` integer,
	`enable_message_parser_early_adoption` integer,
	`nickname` text,
	`bio` text,
	`require_password_change` integer
);
