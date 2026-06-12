CREATE TABLE `custom_emojis` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`aliases` text,
	`extension` text,
	`_updated_at` real
);
--> statement-breakpoint
CREATE TABLE `frequently_used_emojis` (
	`id` text PRIMARY KEY NOT NULL,
	`content` text,
	`extension` text,
	`is_custom` integer,
	`count` real
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`msg` text,
	`t` text,
	`rid` text,
	`ts` real,
	`u` text,
	`alias` text,
	`parse_urls` text,
	`groupable` integer,
	`avatar` text,
	`emoji` text,
	`attachments` text,
	`urls` text,
	`_updated_at` real,
	`status` real,
	`pinned` integer,
	`starred` integer,
	`edited_by` text,
	`reactions` text,
	`role` text,
	`drid` text,
	`dcount` real,
	`dlm` real,
	`tmid` text,
	`tcount` real,
	`tlm` real,
	`replies` text,
	`mentions` text,
	`channels` text,
	`unread` integer,
	`auto_translate` integer,
	`translations` text,
	`tmsg` text,
	`blocks` text,
	`e2e` text,
	`tshow` integer,
	`md` text,
	`content` text,
	`comment` text
);
--> statement-breakpoint
CREATE INDEX `messages_rid_idx` ON `messages` (`rid`);--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`roles` text,
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
	`custom_fields` text,
	`broadcast` integer,
	`encrypted` integer,
	`ro` integer,
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
	`_id` text,
	`f` integer,
	`t` text,
	`ts` real,
	`ls` real,
	`name` text,
	`fname` text,
	`sanitized_fname` text,
	`rid` text,
	`open` integer,
	`alert` integer,
	`roles` text,
	`unread` real,
	`user_mentions` real,
	`group_mentions` real,
	`tunread` text,
	`tunread_user` text,
	`tunread_group` text,
	`room_updated_at` real,
	`ro` integer,
	`last_open` real,
	`last_message` text,
	`description` text,
	`announcement` text,
	`banner_closed` integer,
	`topic` text,
	`blocked` integer,
	`blocker` integer,
	`react_when_read_only` integer,
	`archived` integer,
	`join_code_required` integer,
	`muted` text,
	`ignored` text,
	`broadcast` integer,
	`prid` text,
	`draft_message` text,
	`last_thread_sync` real,
	`jitsi_timeout` real,
	`auto_translate` integer,
	`auto_translate_language` text,
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
	`team_id` text,
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
	`rid` text,
	`subscription_id` text,
	`_updated_at` real,
	`ts` real,
	`u` text,
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
	`content` text
);
--> statement-breakpoint
CREATE INDEX `thread_messages_rid_idx` ON `thread_messages` (`rid`);--> statement-breakpoint
CREATE INDEX `thread_messages_subscription_id_idx` ON `thread_messages` (`subscription_id`);--> statement-breakpoint
CREATE TABLE `threads` (
	`id` text PRIMARY KEY NOT NULL,
	`msg` text,
	`t` text,
	`rid` text,
	`_updated_at` real,
	`ts` real,
	`u` text,
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
	`tmid` text,
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
	`draft_message` text
);
--> statement-breakpoint
CREATE INDEX `threads_rid_idx` ON `threads` (`rid`);--> statement-breakpoint
CREATE TABLE `uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`path` text,
	`rid` text,
	`name` text,
	`tmid` text,
	`description` text,
	`size` real,
	`type` text,
	`store` text,
	`progress` real,
	`error` integer
);
--> statement-breakpoint
CREATE INDEX `uploads_rid_idx` ON `uploads` (`rid`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`_id` text,
	`name` text,
	`username` text,
	`avatar_etag` text
);
--> statement-breakpoint
CREATE INDEX `users_id_idx` ON `users` (`_id`);--> statement-breakpoint
CREATE INDEX `users_username_idx` ON `users` (`username`);