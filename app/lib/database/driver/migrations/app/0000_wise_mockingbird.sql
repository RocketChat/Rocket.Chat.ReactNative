CREATE TABLE `custom_emojis` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`aliases` text,
	`extension` text NOT NULL,
	`_updated_at` real NOT NULL
);
--> statement-breakpoint
CREATE TABLE `frequently_used_emojis` (
	`id` text PRIMARY KEY NOT NULL,
	`content` text,
	`extension` text,
	`is_custom` integer NOT NULL,
	`count` real NOT NULL
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`msg` text,
	`t` text,
	`rid` text NOT NULL,
	`_updated_at` real NOT NULL,
	`ts` real NOT NULL,
	`u` text NOT NULL,
	`alias` text NOT NULL,
	`parse_urls` text NOT NULL,
	`groupable` integer,
	`avatar` text,
	`emoji` text,
	`attachments` text,
	`urls` text,
	`status` real,
	`pinned` integer,
	`starred` integer,
	`edited_by` text,
	`reactions` text,
	`role` text,
	`drid` text,
	`dcount` real,
	`dlm` real,
	`tcount` real,
	`tlm` real,
	`replies` text,
	`mentions` text,
	`channels` text,
	`unread` integer,
	`auto_translate` integer,
	`translations` text,
	`e2e` text,
	`content` text,
	`tmid` text,
	`tmsg` text,
	`blocks` text,
	`tshow` integer,
	`md` text,
	`comment` text
);
--> statement-breakpoint
CREATE INDEX `messages_rid_idx` ON `messages` (`rid`);--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`roles` text NOT NULL,
	`_updated_at` real
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`custom_fields` text NOT NULL,
	`broadcast` integer NOT NULL,
	`encrypted` integer NOT NULL,
	`ro` integer NOT NULL,
	`v` text,
	`department_id` text,
	`served_by` text,
	`livechat_data` text,
	`tags` text,
	`e2e_key_id` text,
	`avatar_etag` text
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`value_as_string` text,
	`value_as_boolean` integer,
	`value_as_number` real,
	`value_as_array` text,
	`_updated_at` real
);
--> statement-breakpoint
CREATE TABLE `slash_commands` (
	`id` text PRIMARY KEY NOT NULL,
	`params` text,
	`description` text,
	`client_only` integer,
	`provides_preview` integer,
	`app_id` text
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`_id` text NOT NULL,
	`f` integer NOT NULL,
	`t` text NOT NULL,
	`ts` real NOT NULL,
	`ls` real NOT NULL,
	`name` text NOT NULL,
	`fname` text NOT NULL,
	`sanitized_fname` text,
	`rid` text NOT NULL,
	`open` integer NOT NULL,
	`alert` integer NOT NULL,
	`roles` text,
	`unread` real NOT NULL,
	`user_mentions` real NOT NULL,
	`group_mentions` real NOT NULL,
	`tunread` text,
	`tunread_user` text,
	`tunread_group` text,
	`room_updated_at` real NOT NULL,
	`ro` integer NOT NULL,
	`last_open` real,
	`last_message` text,
	`description` text,
	`announcement` text,
	`banner_closed` integer,
	`topic` text,
	`blocked` integer,
	`blocker` integer,
	`react_when_read_only` integer,
	`archived` integer NOT NULL,
	`join_code_required` integer,
	`muted` text,
	`ignored` text,
	`broadcast` integer,
	`prid` text,
	`draft_message` text,
	`last_thread_sync` real,
	`jitsi_timeout` real,
	`auto_translate` integer,
	`auto_translate_language` text NOT NULL,
	`hide_unread_status` integer,
	`sys_mes` text,
	`uids` text,
	`usernames` text,
	`visitor` text,
	`department_id` text,
	`served_by` text,
	`livechat_data` text,
	`tags` text,
	`e2e_key` text,
	`old_room_keys` text,
	`e2e_suggested_key` text,
	`encrypted` integer,
	`e2e_key_id` text,
	`users_waiting_for_e2e_keys` text,
	`avatar_etag` text,
	`team_id` text NOT NULL,
	`team_main` integer,
	`on_hold` integer,
	`source` text,
	`hide_mention_status` integer,
	`users_count` real,
	`unmuted` text,
	`disable_notifications` integer,
	`federated` integer,
	`abac_attributes` text,
	`federation` text,
	`status` text,
	`inviter` text
);
--> statement-breakpoint
CREATE INDEX `subscriptions_t_idx` ON `subscriptions` (`t`);--> statement-breakpoint
CREATE INDEX `subscriptions_name_idx` ON `subscriptions` (`name`);--> statement-breakpoint
CREATE INDEX `subscriptions_rid_idx` ON `subscriptions` (`rid`);--> statement-breakpoint
CREATE INDEX `subscriptions_team_id_idx` ON `subscriptions` (`team_id`);--> statement-breakpoint
CREATE TABLE `thread_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`msg` text,
	`t` text,
	`rid` text NOT NULL,
	`_updated_at` real NOT NULL,
	`ts` real NOT NULL,
	`u` text NOT NULL,
	`alias` text,
	`parse_urls` text,
	`groupable` integer,
	`avatar` text,
	`emoji` text,
	`attachments` text,
	`urls` text,
	`status` real,
	`pinned` integer,
	`starred` integer,
	`edited_by` text,
	`reactions` text,
	`role` text,
	`drid` text,
	`dcount` real,
	`dlm` real,
	`tcount` real,
	`tlm` real,
	`replies` text,
	`mentions` text,
	`channels` text,
	`unread` integer,
	`auto_translate` integer,
	`translations` text,
	`e2e` text,
	`content` text,
	`subscription_id` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `thread_messages_rid_idx` ON `thread_messages` (`rid`);--> statement-breakpoint
CREATE INDEX `thread_messages_subscription_id_idx` ON `thread_messages` (`subscription_id`);--> statement-breakpoint
CREATE TABLE `threads` (
	`id` text PRIMARY KEY NOT NULL,
	`msg` text,
	`t` text,
	`rid` text NOT NULL,
	`_updated_at` real NOT NULL,
	`ts` real NOT NULL,
	`u` text NOT NULL,
	`alias` text,
	`parse_urls` text,
	`groupable` integer,
	`avatar` text,
	`emoji` text,
	`attachments` text,
	`urls` text,
	`status` real,
	`pinned` integer,
	`starred` integer,
	`edited_by` text,
	`reactions` text,
	`role` text,
	`drid` text,
	`dcount` real,
	`dlm` real,
	`tcount` real,
	`tlm` real,
	`replies` text,
	`mentions` text,
	`channels` text,
	`unread` integer,
	`auto_translate` integer,
	`translations` text,
	`e2e` text,
	`content` text,
	`tmid` text,
	`draft_message` text
);
--> statement-breakpoint
CREATE INDEX `threads_rid_idx` ON `threads` (`rid`);--> statement-breakpoint
CREATE TABLE `uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`path` text,
	`rid` text NOT NULL,
	`name` text,
	`tmid` text,
	`description` text,
	`size` real NOT NULL,
	`type` text,
	`store` text,
	`progress` real NOT NULL,
	`error` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `uploads_rid_idx` ON `uploads` (`rid`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`_id` text NOT NULL,
	`name` text,
	`username` text NOT NULL,
	`avatar_etag` text
);
--> statement-breakpoint
CREATE INDEX `users_id_idx` ON `users` (`_id`);--> statement-breakpoint
CREATE INDEX `users_username_idx` ON `users` (`username`);