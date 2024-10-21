export default {
	// NEW SERVER VIEW
	NS_CONNECT_TO_WORKSPACE: 'ns_connect_to_workspace',

	// LOGIN VIEW
	LOGIN_DEFAULT_LOGIN: 'login_default_login',
	LOGIN_DEFAULT_LOGIN_F: 'login_default_login_f',
	LOGOUT_BY_SERVER: 'logout_by_server',
	LOGOUT_TOKEN_EXPIRED: 'logout_token_expired',

	// FORGOT PASSWORD VIEW
	FP_FORGOT_PASSWORD: 'fp_forgot_password',
	FP_FORGOT_PASSWORD_F: 'fp_forgot_password_f',

	// SEND EMAIL CONFIRMATION VIEW
	SEC_SEND_EMAIL_CONFIRMATION: 'sec_send_email_confirmation',

	// REGISTER VIEW
	REGISTER_DEFAULT_SIGN_UP: 'register_default_sign_up',
	REGISTER_DEFAULT_SIGN_UP_F: 'register_default_sign_up_f',

	// LOGIN AND REGISTER VIEW
	ENTER_WITH_FACEBOOK: 'enter_with_facebook',
	ENTER_WITH_GITHUB: 'enter_with_github',
	ENTER_WITH_GITLAB: 'enter_with_gitlab',
	ENTER_WITH_LINKEDIN: 'enter_with_linkedin',
	ENTER_WITH_GOOGLE: 'enter_with_google',
	ENTER_WITH_METEOR: 'enter_with_meteor',
	ENTER_WITH_TWITTER: 'enter_with_twitter',
	ENTER_WITH_WORDPRESS: 'enter_with_wordpress',
	ENTER_WITH_CUSTOM_OAUTH: 'enter_with_custom_oauth',
	ENTER_WITH_SAML: 'enter_with_saml',
	ENTER_WITH_CAS: 'enter_with_cas',
	ENTER_WITH_APPLE: 'enter_with_apple',
	ENTER_WITH_APPLE_F: 'enter_with_apple_f',

	// SIDEBAR VIEW
	SIDEBAR_GO_STATUS: 'sidebar_go_status',
	SIDEBAR_GO_CHATS: 'sidebar_go_chats',
	SIDEBAR_GO_PROFILE: 'sidebar_go_profile',
	SIDEBAR_GO_SETTINGS: 'sidebar_go_settings',
	SIDEBAR_GO_ADMINPANEL: 'sidebar_go_admin_panel',

	// STATUS VIEW
	STATUS_DONE: 'status_done',
	STATUS_ONLINE: 'status_online',
	STATUS_BUSY: 'status_busy',
	STATUS_AWAY: 'status_away',
	STATUS_OFFLINE: 'status_offline',
	STATUS_F: 'status_f',
	STATUS_CUSTOM: 'status_custom',
	STATUS_CUSTOM_F: 'status_custom_f',
	SET_STATUS_FAIL: 'set_status_fail',

	// ROOMS LIST VIEW
	RL_ADD_SERVER: 'rl_add_server',
	RL_CHANGE_SERVER: 'rl_change_server',
	RL_GO_NEW_MSG: 'rl_go_new_msg',
	RL_GO_E2E_SAVE_PASSWORD: 'rl_go_e2e_save_password',
	RL_SEARCH: 'rl_search',
	RL_GO_DIRECTORY: 'rl_go_directory',
	RL_GO_QUEUE: 'rl_go_queue',
	RL_GO_ROOM: 'rl_go_room',
	RL_FAVORITE_CHANNEL: 'rl_favorite_channel',
	RL_UNFAVORITE_CHANNEL: 'rl_unfavorite_channel',
	RL_TOGGLE_FAVORITE_F: 'rl_toggle_favorite_f',
	RL_READ_CHANNEL: 'rl_read_channel',
	RL_UNREAD_CHANNEL: 'rl_unread_channel',
	RL_TOGGLE_READ_F: 'rl_toggle_read_f',
	RL_HIDE_CHANNEL: 'rl_hide_channel',
	RL_HIDE_CHANNEL_F: 'rl_hide_channel_f',
	RL_CREATE_NEW_WORKSPACE: 'rl_create_new_workspace',

	// DISPLAY PREFERENCES VIEW
	DP_SORT_CHANNELS_BY_NAME: 'dp_sort_channels_by_name',
	DP_SORT_CHANNELS_BY_ACTIVITY: 'dp_sort_channels_by_activity',
	DP_GROUP_CHANNELS_BY_TYPE: 'dp_group_channels_by_type',
	DP_GROUP_CHANNELS_BY_FAVORITE: 'dp_group_channels_by_favorite',
	DP_GROUP_CHANNELS_BY_UNREAD: 'dp_group_channels_by_unread',
	DP_TOGGLE_AVATAR: 'dp_toggle_avatar',
	DP_DISPLAY_EXPANDED: 'dp_display_expanded',
	DP_DISPLAY_CONDENSED: 'dp_display_condensed',

	// QUEUE LIST VIEW
	QL_GO_ROOM: 'ql_go_room',

	// DIRECTORY VIEW
	DIRECTORY_SEARCH_USERS: 'directory_search_users',
	DIRECTORY_SEARCH_CHANNELS: 'directory_search_channels',
	DIRECTORY_SEARCH_TEAMS: 'directory_search_teams',

	// NEW MESSAGE VIEW
	NEW_MSG_CREATE_CHANNEL: 'new_msg_create_channel',
	NEW_MSG_CREATE_TEAM: 'new_msg_create_team',
	NEW_MSG_CREATE_GROUP_CHAT: 'new_msg_create_group_chat',
	NEW_MSG_CREATE_DISCUSSION: 'new_msg_create_discussion',
	NEW_MSG_CHAT_WITH_USER: 'new_msg_chat_with_user',

	// SELECTED USERS VIEW
	SELECTED_USERS_ADD_USER: 'selected_users_add_user',
	SELECTED_USERS_REMOVE_USER: 'selected_users_remove_user',
	SELECTED_USERS_CREATE_GROUP: 'selected_users_create_group',
	SELECTED_USERS_CREATE_GROUP_F: 'selected_users_create_group_f',

	// ADD EXISTING CHANNEL VIEW
	AEC_ADD_CHANNEL: 'aec_add_channel',
	AEC_REMOVE_CHANNEL: 'aec_remove_channel',

	// CREATE CHANNEL VIEW
	CR_CREATE: 'cr_create',
	CT_CREATE: 'ct_create',
	CR_CREATE_F: 'cr_create_f',
	CT_CREATE_F: 'ct_create_f',
	CR_TOGGLE_TYPE: 'cr_toggle_type',
	CR_TOGGLE_READ_ONLY: 'cr_toggle_read_only',
	CR_TOGGLE_BROADCAST: 'cr_toggle_broadcast',
	CR_TOGGLE_ENCRYPTED: 'cr_toggle_encrypted',
	CR_REMOVE_USER: 'cr_remove_user',
	CT_ADD_ROOM_TO_TEAM: 'ct_add_room_to_team',
	CT_ADD_ROOM_TO_TEAM_F: 'ct_add_room_to_team_f',

	// CREATE DISCUSSION VIEW
	CD_CREATE: 'cd_create',
	CD_CREATE_F: 'cd_create_f',
	CD_SELECT_CHANNEL: 'cd_select_channel',
	CD_SELECT_USERS: 'cd_select_users',
	CD_TOGGLE_ENCRY: 'cd_toggle_encry',

	// PROFILE VIEW
	PROFILE_PICK_AVATAR: 'profile_pick_avatar',
	PROFILE_PICK_AVATAR_F: 'profile_pick_avatar_f',
	PROFILE_PICK_AVATAR_WITH_URL: 'profile_pick_avatar_with_url',
	PROFILE_SAVE_AVATAR: 'profile_save_avatar',
	PROFILE_SAVE_AVATAR_F: 'profile_save_avatar_f',
	PROFILE_SAVE_CHANGES: 'profile_save_changes',
	PROFILE_SAVE_CHANGES_F: 'profile_save_changes_f',
	// PROFILE LOGOUT
	PL_OTHER_LOCATIONS: 'pl_other_locations',
	PL_OTHER_LOCATIONS_F: 'pl_other_locations_f',

	// SETTINGS VIEW
	SE_CONTACT_US: 'se_contact_us',
	SE_CONTACT_US_F: 'se_contact_us_f',
	SE_GO_LANGUAGE: 'se_go_language',
	SE_GO_DEFAULTBROWSER: 'se_go_default_browser',
	SE_GO_THEME: 'se_go_theme',
	SE_GO_PROFILE: 'se_go_profile',
	SE_GO_SECURITYPRIVACY: 'se_go_securityprivacy',
	SE_REVIEW_THIS_APP: 'se_review_this_app',
	SE_REVIEW_THIS_APP_F: 'se_review_this_app_f',
	SE_SHARE_THIS_APP: 'se_share_this_app',
	SE_READ_LICENSE: 'se_read_license',
	SE_COPY_APP_VERSION: 'se_copy_app_version',
	SE_COPY_SERVER_VERSION: 'se_copy_server_version',
	SE_CLEAR_LOCAL_SERVER_CACHE: 'se_clear_local_server_cache',
	SE_LOG_OUT: 'se_log_out',

	// USER PREFERENCE VIEW
	UP_GO_USER_NOTIFICATION_PREF: 'up_go_user_notification_pref',

	// SECURITY PRIVACY VIEW
	SP_GO_E2EENCRYPTIONSECURITY: 'sp_go_e2e_encryption_security',
	SP_GO_SCREENLOCKCONFIG: 'sp_go_screen_lock_cfg',
	SP_TOGGLE_CRASH_REPORT: 'sp_toggle_crash_report',
	SP_TOGGLE_ANALYTICS_EVENTS: 'sp_toggle_analytics_events',

	// LANGUAGE VIEW
	LANG_SET_LANGUAGE: 'lang_set_language',
	LANG_SET_LANGUAGE_F: 'lang_set_language_f',

	// DEFAULT BROWSER VIEW
	DB_CHANGE_DEFAULT_BROWSER: 'db_change_default_browser',
	DB_CHANGE_DEFAULT_BROWSER_F: 'db_change_default_browser_f',

	// THEME VIEW
	THEME_SET_THEME_GROUP: 'theme_set_theme_group',
	THEME_SET_DARK_LEVEL: 'theme_set_dark_level',

	// SCREEN LOCK CONFIG VIEW
	SLC_SAVE_SCREEN_LOCK: 'slc_save_screen_lock',
	SLC_TOGGLE_AUTOLOCK: 'slc_toggle_autolock',
	SLC_TOGGLE_BIOMETRY: 'slc_toggle_biometry',
	SLC_CHANGE_PASSCODE: 'slc_change_passcode',
	SLC_CHANGE_AUTOLOCK_TIME: 'slc_change_autolock_time',

	// ROOM VIEW
	ROOM_SEND_MESSAGE: 'room_send_message',
	ROOM_ENCRYPTED_PRESS: 'room_encrypted_press',
	ROOM_OPEN_EMOJI: 'room_open_emoji',
	ROOM_CLOSE_EMOJI: 'room_close_emoji',
	ROOM_AUDIO_RECORD: 'room_audio_record',
	ROOM_AUDIO_RECORD_F: 'room_audio_record_f',
	ROOM_AUDIO_FINISH: 'room_audio_finish',
	ROOM_AUDIO_FINISH_F: 'room_audio_finish_f',
	ROOM_AUDIO_CANCEL: 'room_audio_cancel',
	ROOM_AUDIO_CANCEL_F: 'room_audio_cancel_f',
	ROOM_SHOW_MORE_ACTIONS: 'room_show_more_actions',
	ROOM_SHOW_BOX_ACTIONS: 'room_show_box_actions',
	ROOM_BOX_ACTION_PHOTO: 'room_box_action_photo',
	ROOM_BOX_ACTION_PHOTO_F: 'room_box_action_photo_f',
	ROOM_BOX_ACTION_VIDEO: 'room_box_action_video',
	ROOM_BOX_ACTION_VIDEO_F: 'room_box_action_video_f',
	ROOM_BOX_ACTION_LIBRARY: 'room_box_action_library',
	ROOM_BOX_ACTION_LIBRARY_F: 'room_box_action_library_f',
	ROOM_BOX_ACTION_FILE: 'room_box_action_file',
	ROOM_BOX_ACTION_FILE_F: 'room_box_action_file_f',
	ROOM_BOX_ACTION_DISCUSSION: 'room_box_action_discussion',
	ROOM_SHOW_MSG_ACTIONS: 'room_show_msg_actions',
	ROOM_MSG_ACTION_REPLY: 'room_msg_action_reply',
	ROOM_MSG_ACTION_QUOTE: 'room_msg_action_quote',
	ROOM_MSG_ACTION_EDIT: 'room_msg_action_edit',
	ROOM_MSG_ACTION_DELETE: 'room_msg_action_delete',
	ROOM_MSG_ACTION_DELETE_F: 'room_msg_action_delete_f',
	ROOM_MSG_ACTION_PERMALINK: 'room_msg_action_permalink',
	ROOM_MSG_ACTION_PERMALINK_F: 'room_msg_action_permalink_f',
	ROOM_MSG_ACTION_DISCUSSION: 'room_msg_action_discussion',
	ROOM_MSG_ACTION_UNREAD: 'room_msg_action_unread',
	ROOM_MSG_ACTION_UNREAD_F: 'room_msg_action_unread_f',
	ROOM_MSG_ACTION_COPY: 'room_msg_action_copy',
	ROOM_MSG_ACTION_SHARE: 'room_msg_action_share',
	ROOM_MSG_ACTION_SHARE_F: 'room_msg_action_share_f',
	ROOM_MSG_ACTION_STAR: 'room_msg_action_star',
	ROOM_MSG_ACTION_UNSTAR: 'room_msg_action_unstar',
	ROOM_MSG_ACTION_STAR_F: 'room_msg_action_star_f',
	ROOM_MSG_ACTION_PIN: 'room_msg_action_pin',
	ROOM_MSG_ACTION_PIN_F: 'room_msg_action_pin_f',
	ROOM_MSG_ACTION_REACTION: 'room_msg_action_reaction',
	ROOM_MSG_ACTION_REPORT: 'room_msg_action_report',
	ROOM_MSG_ACTION_REPORT_F: 'room_msg_action_report_f',
	ROOM_JOIN: 'room_join',
	ROOM_RESUME: 'room_resume',
	ROOM_GO_RA: 'room_go_ra',
	ROOM_TOGGLE_FOLLOW_THREADS: 'room_toggle_follow_threads',
	ROOM_GO_TEAM_CHANNELS: 'room_go_team_channels',
	ROOM_GO_SEARCH: 'room_go_search',
	ROOM_GO_THREADS: 'room_go_threads',
	ROOM_GO_ROOM_INFO: 'room_go_room_info',
	ROOM_GO_USER_INFO: 'room_go_user_info',
	ROOM_MENTION_GO_USER_INFO: 'room_mention_go_user_info',
	COMMAND_RUN: 'command_run',
	COMMAND_RUN_F: 'command_run_f',
	MB_BACKSPACE: 'mb_backspace',
	MB_EMOJI_SELECTED: 'mb_emoji_selected',
	MB_EMOJI_SEARCH_PRESSED: 'mb_emoji_search_pressed',
	MB_SB_EMOJI_SEARCH: 'mb_sb_emoji_search',
	MB_SB_EMOJI_SELECTED: 'mb_sb_emoji_selected',
	REACTION_PICKER_EMOJI_SELECTED: 'reaction_picker_emoji_selected',
	REACTION_PICKER_SEARCH_EMOJIS: 'reaction_picker_search_emojis',

	// ROOM ACTIONS VIEW
	RA_JITSI_VIDEO: 'ra_jitsi_video',
	RA_JITSI_AUDIO: 'ra_jitsi_audio',
	RA_JITSI_F: 'ra_jitsi_f',
	RA_GO_ROOMINFO: 'ra_go_room_info',
	RA_GO_ROOMMEMBERS: 'ra_go_room_members',
	RA_GO_SELECTEDUSERS: 'ra_go_selected_users',
	RA_GO_INVITEUSERS: 'ra_go_invite_users',
	RA_GO_MESSAGESFILES: 'ra_go_messages_files',
	RA_GO_MESSAGESMENTIONS: 'ra_go_messages_mentions',
	RA_GO_MESSAGESSTARRED: 'ra_go_messages_starred',
	RA_GO_SEARCHMESSAGES: 'ra_go_search_messages',
	RA_GO_MESSAGESPINNED: 'ra_go_messages_pinned',
	RA_GO_AUTOTRANSLATE: 'ra_go_autotranslate',
	RA_GO_NOTIFICATIONPREF: 'ra_go_notification_pref',
	RA_GO_FORWARDLIVECHAT: 'ra_go_forward_livechat',
	RA_SHARE: 'ra_share',
	RA_LEAVE: 'ra_leave',
	RA_LEAVE_F: 'ra_leave_f',
	RA_TOGGLE_BLOCK_USER: 'ra_toggle_block_user',
	RA_TOGGLE_BLOCK_USER_F: 'ra_toggle_block_user_f',
	RA_TOGGLE_ENCRYPTED: 'ra_toggle_encrypted',
	RA_TOGGLE_ENCRYPTED_F: 'ra_toggle_encrypted_f',
	RA_LEAVE_TEAM: 'ra_leave_team',
	RA_LEAVE_TEAM_F: 'ra_leave_team_f',
	RA_CONVERT_TO_TEAM: 'ra_convert_to_team',
	RA_CONVERT_TO_TEAM_F: 'ra_convert_to_team_f',
	RA_CONVERT_TEAM_TO_CHANNEL: 'ra_convert_team_to_channel',
	RA_CONVERT_TEAM_TO_CHANNEL_F: 'ra_convert_team_to_channel_f',
	RA_MOVE_TO_TEAM: 'ra_move_to_team',
	RA_MOVE_TO_TEAM_F: 'ra_move_to_team_f',
	RA_SEARCH_TEAM: 'ra_search_team',

	// ROOM MEMBERS ACTIONS VIEW
	RM_GO_SELECTEDUSERS: 'rm_go_selected_users',
	RM_GO_INVITEUSERS: 'rm_go_invite_users',

	// ROOM INFO VIEW
	RI_GO_RI_EDIT: 'ri_go_ri_edit',
	RI_GO_LIVECHAT_EDIT: 'ri_go_livechat_edit',
	RI_GO_ROOM_USER: 'ri_go_room_user',
	RI_TOGGLE_BLOCK_USER: 'ri_toggle_block_user',

	// ROOM INFO EDIT VIEW
	RI_EDIT_TOGGLE_ROOM_TYPE: 'ri_edit_toggle_room_type',
	RI_EDIT_TOGGLE_READ_ONLY: 'ri_edit_toggle_read_only',
	RI_EDIT_TOGGLE_REACTIONS: 'ri_edit_toggle_reactions',
	RI_EDIT_TOGGLE_SYSTEM_MSG: 'ri_edit_toggle_system_msg',
	RI_EDIT_TOGGLE_ENCRYPTED: 'ri_edit_toggle_encrypted',
	RI_EDIT_SAVE: 'ri_edit_save',
	RI_EDIT_SAVE_F: 'ri_edit_save_f',
	RI_EDIT_RESET: 'ri_edit_reset',
	RI_EDIT_TOGGLE_ARCHIVE: 'ri_edit_toggle_archive',
	RI_EDIT_TOGGLE_ARCHIVE_F: 'ri_edit_toggle_archive_f',
	RI_EDIT_DELETE: 'ri_edit_delete',
	RI_EDIT_DELETE_F: 'ri_edit_delete_f',
	RI_EDIT_DELETE_TEAM: 'ri_edit_delete_team',
	RI_EDIT_DELETE_TEAM_F: 'ri_edit_delete_team_f',

	// JITSI MEET VIEW
	JM_CONFERENCE_JOIN: 'jm_conference_join',
	JM_CONFERENCE_TERMINATE: 'jm_conference_terminate',

	// INVITE USERS VIEW
	IU_SHARE: 'iu_share',
	IU_GO_IU_EDIT: 'iu_go_iu_edit',

	// INVITE USERS EDIT VIEW
	IU_EDIT_SET_LINK_PARAM: 'iu_edit_set_link_param',
	IU_EDIT_CREATE_LINK: 'iu_edit_create_link',

	// AUTO TRANSLATE VIEW
	AT_TOGGLE_TRANSLATE: 'at_toggle_translate',
	AT_TOGGLE_TRANSLATE_F: 'at_toggle_translate_f',
	AT_SET_LANG: 'at_set_lang',
	AT_SET_LANG_F: 'at_set_lang_f',

	// NOTIFICATION PREFERENCES VIEW
	NP_DISABLENOTIFICATIONS: 'np_disable_notification',
	NP_DISABLENOTIFICATIONS_F: 'np_disable_notification_f',
	NP_MUTEGROUPMENTIONS: 'np_mute_group_mentions',
	NP_MUTEGROUPMENTIONS_F: 'np_mute_group_mentions_f',
	NP_HIDEUNREADSTATUS: 'np_hide_unread_status',
	NP_HIDEUNREADSTATUS_F: 'np_hide_unread_status_f',
	NP_DESKTOPNOTIFICATIONS: 'np_desktop_notifications',
	NP_DESKTOPNOTIFICATIONS_F: 'np_desktop_notifications_f',
	NP_MOBILEPUSHNOTIFICATIONS: 'np_mobile_push_notifications',
	NP_MOBILEPUSHNOTIFICATIONS_F: 'np_mobile_push_notifications_f',
	NP_AUDIONOTIFICATIONS: 'np_audio_notifications',
	NP_AUDIONOTIFICATIONS_F: 'np_audio_notifications_f',
	NP_AUDIONOTIFICATIONVALUE: 'np_audio_notification_value',
	NP_AUDIONOTIFICATIONVALUE_F: 'np_audio_notification_value_f',
	NP_EMAILNOTIFICATIONS: 'np_email_notifications',
	NP_EMAILNOTIFICATIONS_F: 'np_email_notifications_f',

	// E2E SAVE YOUR PASSWORD VIEW
	E2E_SAVE_PW_SAVED: 'e2e_save_pw_saved',
	E2E_SAVE_PW_COPY: 'e2e_save_pw_copy',
	E2E_SAVE_PW_HOW_IT_WORKS: 'e2e_save_pw_how_it_works',

	// E2E ENTER YOUR PASSWORD VIEW
	E2E_ENTER_PW_SUBMIT: 'e2e_enter_pw_submit',

	// E2E ENCRYPTION SECURITY VIEW
	E2E_SEC_CHANGE_PASSWORD: 'e2e_sec_change_password',
	E2E_SEC_RESET_OWN_KEY: 'e2e_sec_reset_own_key',

	// TEAM CHANNELS VIEW
	TC_SEARCH: 'tc_search',
	TC_CANCEL_SEARCH: 'tc_cancel_search',
	TC_GO_ACTIONS: 'tc_go_actions',
	TC_GO_ROOM: 'tc_go_room',
	TC_DELETE_ROOM: 'tc_delete_room',
	TC_DELETE_ROOM_F: 'tc_delete_room_f',
	TC_TOGGLE_AUTOJOIN: 'tc_toggle_autojoin',
	TC_TOGGLE_AUTOJOIN_F: 'tc_toggle_autojoin_f',

	// LIVECHAT VIDEOCONF
	LIVECHAT_VIDEOCONF_JOIN: 'livechat_videoconf_join',
	LIVECHAT_VIDEOCONF_TERMINATE: 'livechat_videoconf_terminate',

	// DELETE OWN ACCOUNT ACCOUNT
	DELETE_OWN_ACCOUNT: 'delete_own_account',
	DELETE_OWN_ACCOUNT_F: 'delete_own_account_f'
};
