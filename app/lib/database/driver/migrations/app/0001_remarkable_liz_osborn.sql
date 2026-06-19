PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_custom_emojis` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`aliases` text,
	`extension` text NOT NULL,
	`_updated_at` real NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_custom_emojis`("id", "name", "aliases", "extension", "_updated_at") SELECT "id", "name", "aliases", "extension", "_updated_at" FROM `custom_emojis`;--> statement-breakpoint
DROP TABLE `custom_emojis`;--> statement-breakpoint
ALTER TABLE `__new_custom_emojis` RENAME TO `custom_emojis`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_frequently_used_emojis` (
	`id` text PRIMARY KEY NOT NULL,
	`content` text,
	`extension` text,
	`is_custom` integer NOT NULL,
	`count` real NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_frequently_used_emojis`("id", "content", "extension", "is_custom", "count") SELECT "id", "content", "extension", "is_custom", "count" FROM `frequently_used_emojis`;--> statement-breakpoint
DROP TABLE `frequently_used_emojis`;--> statement-breakpoint
ALTER TABLE `__new_frequently_used_emojis` RENAME TO `frequently_used_emojis`;--> statement-breakpoint
CREATE TABLE `__new_messages` (
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
INSERT INTO `__new_messages`("id", "msg", "t", "rid", "_updated_at", "ts", "u", "alias", "parse_urls", "groupable", "avatar", "emoji", "attachments", "urls", "status", "pinned", "starred", "edited_by", "reactions", "role", "drid", "dcount", "dlm", "tcount", "tlm", "replies", "mentions", "channels", "unread", "auto_translate", "translations", "e2e", "content", "tmid", "tmsg", "blocks", "tshow", "md", "comment") SELECT "id", "msg", "t", "rid", "_updated_at", "ts", "u", "alias", "parse_urls", "groupable", "avatar", "emoji", "attachments", "urls", "status", "pinned", "starred", "edited_by", "reactions", "role", "drid", "dcount", "dlm", "tcount", "tlm", "replies", "mentions", "channels", "unread", "auto_translate", "translations", "e2e", "content", "tmid", "tmsg", "blocks", "tshow", "md", "comment" FROM `messages`;--> statement-breakpoint
DROP TABLE `messages`;--> statement-breakpoint
ALTER TABLE `__new_messages` RENAME TO `messages`;--> statement-breakpoint
CREATE INDEX `messages_rid_idx` ON `messages` (`rid`);--> statement-breakpoint
CREATE TABLE `__new_permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`roles` text NOT NULL,
	`_updated_at` real
);
--> statement-breakpoint
INSERT INTO `__new_permissions`("id", "roles", "_updated_at") SELECT "id", "roles", "_updated_at" FROM `permissions`;--> statement-breakpoint
DROP TABLE `permissions`;--> statement-breakpoint
ALTER TABLE `__new_permissions` RENAME TO `permissions`;--> statement-breakpoint
CREATE TABLE `__new_rooms` (
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
INSERT INTO `__new_rooms`("id", "custom_fields", "broadcast", "encrypted", "ro", "v", "department_id", "served_by", "livechat_data", "tags", "e2e_key_id", "avatar_etag") SELECT "id", "custom_fields", "broadcast", "encrypted", "ro", "v", "department_id", "served_by", "livechat_data", "tags", "e2e_key_id", "avatar_etag" FROM `rooms`;--> statement-breakpoint
DROP TABLE `rooms`;--> statement-breakpoint
ALTER TABLE `__new_rooms` RENAME TO `rooms`;--> statement-breakpoint
CREATE TABLE `__new_subscriptions` (
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
INSERT INTO `__new_subscriptions`("id", "_id", "f", "t", "ts", "ls", "name", "fname", "sanitized_fname", "rid", "open", "alert", "roles", "unread", "user_mentions", "group_mentions", "tunread", "tunread_user", "tunread_group", "room_updated_at", "ro", "last_open", "last_message", "description", "announcement", "banner_closed", "topic", "blocked", "blocker", "react_when_read_only", "archived", "join_code_required", "muted", "ignored", "broadcast", "prid", "draft_message", "last_thread_sync", "jitsi_timeout", "auto_translate", "auto_translate_language", "hide_unread_status", "sys_mes", "uids", "usernames", "visitor", "department_id", "served_by", "livechat_data", "tags", "e2e_key", "old_room_keys", "e2e_suggested_key", "encrypted", "e2e_key_id", "users_waiting_for_e2e_keys", "avatar_etag", "team_id", "team_main", "on_hold", "source", "hide_mention_status", "users_count", "unmuted", "disable_notifications", "federated", "abac_attributes", "federation", "status", "inviter") SELECT "id", "_id", "f", "t", "ts", "ls", "name", "fname", "sanitized_fname", "rid", "open", "alert", "roles", "unread", "user_mentions", "group_mentions", "tunread", "tunread_user", "tunread_group", "room_updated_at", "ro", "last_open", "last_message", "description", "announcement", "banner_closed", "topic", "blocked", "blocker", "react_when_read_only", "archived", "join_code_required", "muted", "ignored", "broadcast", "prid", "draft_message", "last_thread_sync", "jitsi_timeout", "auto_translate", "auto_translate_language", "hide_unread_status", "sys_mes", "uids", "usernames", "visitor", "department_id", "served_by", "livechat_data", "tags", "e2e_key", "old_room_keys", "e2e_suggested_key", "encrypted", "e2e_key_id", "users_waiting_for_e2e_keys", "avatar_etag", "team_id", "team_main", "on_hold", "source", "hide_mention_status", "users_count", "unmuted", "disable_notifications", "federated", "abac_attributes", "federation", "status", "inviter" FROM `subscriptions`;--> statement-breakpoint
DROP TABLE `subscriptions`;--> statement-breakpoint
ALTER TABLE `__new_subscriptions` RENAME TO `subscriptions`;--> statement-breakpoint
CREATE INDEX `subscriptions_t_idx` ON `subscriptions` (`t`);--> statement-breakpoint
CREATE INDEX `subscriptions_name_idx` ON `subscriptions` (`name`);--> statement-breakpoint
CREATE INDEX `subscriptions_rid_idx` ON `subscriptions` (`rid`);--> statement-breakpoint
CREATE INDEX `subscriptions_team_id_idx` ON `subscriptions` (`team_id`);--> statement-breakpoint
CREATE TABLE `__new_thread_messages` (
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
INSERT INTO `__new_thread_messages`("id", "msg", "t", "rid", "_updated_at", "ts", "u", "alias", "parse_urls", "groupable", "avatar", "emoji", "attachments", "urls", "status", "pinned", "starred", "edited_by", "reactions", "role", "drid", "dcount", "dlm", "tcount", "tlm", "replies", "mentions", "channels", "unread", "auto_translate", "translations", "e2e", "content", "subscription_id") SELECT "id", "msg", "t", "rid", "_updated_at", "ts", "u", "alias", "parse_urls", "groupable", "avatar", "emoji", "attachments", "urls", "status", "pinned", "starred", "edited_by", "reactions", "role", "drid", "dcount", "dlm", "tcount", "tlm", "replies", "mentions", "channels", "unread", "auto_translate", "translations", "e2e", "content", "subscription_id" FROM `thread_messages`;--> statement-breakpoint
DROP TABLE `thread_messages`;--> statement-breakpoint
ALTER TABLE `__new_thread_messages` RENAME TO `thread_messages`;--> statement-breakpoint
CREATE INDEX `thread_messages_rid_idx` ON `thread_messages` (`rid`);--> statement-breakpoint
CREATE INDEX `thread_messages_subscription_id_idx` ON `thread_messages` (`subscription_id`);--> statement-breakpoint
CREATE TABLE `__new_threads` (
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
INSERT INTO `__new_threads`("id", "msg", "t", "rid", "_updated_at", "ts", "u", "alias", "parse_urls", "groupable", "avatar", "emoji", "attachments", "urls", "status", "pinned", "starred", "edited_by", "reactions", "role", "drid", "dcount", "dlm", "tcount", "tlm", "replies", "mentions", "channels", "unread", "auto_translate", "translations", "e2e", "content", "tmid", "draft_message") SELECT "id", "msg", "t", "rid", "_updated_at", "ts", "u", "alias", "parse_urls", "groupable", "avatar", "emoji", "attachments", "urls", "status", "pinned", "starred", "edited_by", "reactions", "role", "drid", "dcount", "dlm", "tcount", "tlm", "replies", "mentions", "channels", "unread", "auto_translate", "translations", "e2e", "content", "tmid", "draft_message" FROM `threads`;--> statement-breakpoint
DROP TABLE `threads`;--> statement-breakpoint
ALTER TABLE `__new_threads` RENAME TO `threads`;--> statement-breakpoint
CREATE INDEX `threads_rid_idx` ON `threads` (`rid`);--> statement-breakpoint
CREATE TABLE `__new_uploads` (
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
INSERT INTO `__new_uploads`("id", "path", "rid", "name", "tmid", "description", "size", "type", "store", "progress", "error") SELECT "id", "path", "rid", "name", "tmid", "description", "size", "type", "store", "progress", "error" FROM `uploads`;--> statement-breakpoint
DROP TABLE `uploads`;--> statement-breakpoint
ALTER TABLE `__new_uploads` RENAME TO `uploads`;--> statement-breakpoint
CREATE INDEX `uploads_rid_idx` ON `uploads` (`rid`);--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`_id` text NOT NULL,
	`name` text,
	`username` text NOT NULL,
	`avatar_etag` text
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "_id", "name", "username", "avatar_etag") SELECT "id", "_id", "name", "username", "avatar_etag" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE INDEX `users_id_idx` ON `users` (`_id`);--> statement-breakpoint
CREATE INDEX `users_username_idx` ON `users` (`username`);