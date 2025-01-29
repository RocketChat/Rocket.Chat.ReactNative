// DEPRECATED: This settings are deprecated and will be removed in the LTS only support
const deprecatedSettings = {
	Jitsi_Enable_Teams: {
		type: 'valueAsBoolean'
	},
	Jitsi_Enable_Channels: {
		type: 'valuesAsBoolean'
	},
	Jitsi_Enabled: {
		type: 'valueAsBoolean'
	},
	Jitsi_SSL: {
		type: 'valueAsBoolean'
	},
	Jitsi_Domain: {
		type: 'valueAsString'
	},
	Jitsi_Enabled_TokenAuth: {
		type: 'valueAsBoolean'
	},
	Jitsi_URL_Room_Hash: {
		type: 'valueAsBoolean'
	},
	Jitsi_URL_Room_Prefix: {
		type: 'valueAsString'
	}
};

export const defaultSettings = {
	Accounts_AllowEmailChange: {
		type: 'valueAsBoolean'
	},
	Accounts_AllowPasswordChange: {
		type: 'valueAsBoolean'
	},
	Accounts_AllowRealNameChange: {
		type: 'valueAsBoolean'
	},
	Accounts_AllowUserAvatarChange: {
		type: 'valueAsBoolean'
	},
	Accounts_AllowUserProfileChange: {
		type: 'valueAsBoolean'
	},
	Accounts_AllowUserStatusMessageChange: {
		type: 'valueAsBoolean'
	},
	Accounts_AllowUsernameChange: {
		type: 'valueAsBoolean'
	},
	Accounts_AvatarBlockUnauthenticatedAccess: {
		type: 'valueAsBoolean'
	},
	Accounts_CustomFields: {
		type: 'valueAsString'
	},
	Accounts_EmailOrUsernamePlaceholder: {
		type: 'valueAsString'
	},
	Accounts_EmailVerification: {
		type: 'valueAsBoolean'
	},
	Accounts_NamePlaceholder: {
		type: 'valueAsString'
	},
	Accounts_PasswordPlaceholder: {
		type: 'valueAsString'
	},
	Accounts_PasswordReset: {
		type: 'valueAsBoolean'
	},
	Accounts_RegistrationForm: {
		type: 'valueAsString'
	},
	Accounts_RegistrationForm_LinkReplacementText: {
		type: 'valueAsString'
	},
	Accounts_ShowFormLogin: {
		type: 'valueAsBoolean'
	},
	Accounts_ManuallyApproveNewUsers: {
		type: 'valueAsBoolean'
	},
	API_Use_REST_For_DDP_Calls: {
		type: 'valueAsBoolean'
	},
	Accounts_iframe_enabled: {
		type: 'valueAsBoolean'
	},
	Accounts_Iframe_api_url: {
		type: 'valueAsString'
	},
	Accounts_Iframe_api_method: {
		type: 'valueAsString'
	},
	API_Embed: {
		type: 'valueAsBoolean'
	},
	CROWD_Enable: {
		type: 'valueAsBoolean'
	},
	DirectMesssage_maxUsers: {
		type: 'valueAsNumber'
	},
	E2E_Enable: {
		type: 'valueAsBoolean'
	},
	E2E_Enabled_Default_PrivateRooms: {
		type: 'valueAsBoolean'
	},
	E2E_Enable_Encrypt_Files: {
		type: 'valueAsBoolean'
	},
	FileUpload_ProtectFiles: {
		type: 'valueAsBoolean'
	},
	Accounts_Directory_DefaultView: {
		type: 'valueAsString'
	},
	FEDERATION_Enabled: {
		type: 'valueAsBoolean'
	},
	Hide_System_Messages: {
		type: 'valueAsArray'
	},
	LDAP_Enable: {
		type: 'valueAsBoolean'
	},
	Livechat_request_comment_when_closing_conversation: {
		type: 'valueAsBoolean'
	},
	Message_AllowDeleting: {
		type: 'valueAsBoolean'
	},
	Message_AllowDeleting_BlockDeleteInMinutes: {
		type: 'valueAsNumber'
	},
	Message_AllowEditing: {
		type: 'valueAsBoolean'
	},
	Message_AllowEditing_BlockEditInMinutes: {
		type: 'valueAsNumber'
	},
	Message_AllowPinning: {
		type: 'valueAsBoolean'
	},
	Message_AllowStarring: {
		type: 'valueAsBoolean'
	},
	Message_AudioRecorderEnabled: {
		type: 'valueAsBoolean'
	},
	Message_GroupingPeriod: {
		type: 'valueAsNumber'
	},
	Message_TimeFormat: {
		type: 'valueAsString'
	},
	Message_TimeAndDateFormat: {
		type: 'valueAsString'
	},
	Site_Name: {
		type: 'valueAsString'
	},
	Site_Url: {
		type: 'valueAsString'
	},
	Store_Last_Message: {
		type: 'valueAsBoolean'
	},
	uniqueID: {
		type: 'valueAsString'
	},
	UI_Allow_room_names_with_special_chars: {
		type: 'valueAsBoolean'
	},
	UI_Use_Real_Name: {
		type: 'valueAsBoolean'
	},
	Assets_favicon_512: {
		type: null
	},
	Message_Read_Receipt_Enabled: {
		type: 'valueAsBoolean'
	},
	Message_Read_Receipt_Store_Users: {
		type: 'valueAsBoolean'
	},
	Threads_enabled: {
		type: 'valueAsBoolean'
	},
	FileUpload_MediaTypeWhiteList: {
		type: 'valueAsString'
	},
	FileUpload_MaxFileSize: {
		type: 'valueAsNumber'
	},
	API_Gitlab_URL: {
		type: 'valueAsString'
	},
	AutoTranslate_Enabled: {
		type: 'valueAsBoolean'
	},
	CAS_enabled: {
		type: 'valueAsBoolean'
	},
	CAS_login_url: {
		type: 'valueAsString'
	},
	Force_Screen_Lock: {
		type: 'valueAsBoolean'
	},
	Force_Screen_Lock_After: {
		type: 'valueAsNumber'
	},
	Allow_Save_Media_to_Gallery: {
		type: 'valueAsBoolean'
	},
	Accounts_AllowInvisibleStatusOption: {
		type: 'valueAsString'
	},
	Canned_Responses_Enable: {
		type: 'valueAsBoolean'
	},
	Livechat_allow_manual_on_hold: {
		type: 'valueAsBoolean'
	},
	Accounts_AvatarExternalProviderUrl: {
		type: 'valueAsString'
	},
	Accounts_RoomAvatarExternalProviderUrl: {
		type: 'valueAsString'
	},
	VideoConf_Enable_DMs: {
		type: 'valueAsBoolean'
	},
	VideoConf_Enable_Channels: {
		type: 'valueAsBoolean'
	},
	VideoConf_Enable_Groups: {
		type: 'valueAsBoolean'
	},
	VideoConf_Enable_Teams: {
		type: 'valueAsBoolean'
	},
	Accounts_AllowDeleteOwnAccount: {
		type: 'valueAsBoolean'
	},
	Number_of_users_autocomplete_suggestions: {
		type: 'valueAsNumber'
	},
	Presence_broadcast_disabled: {
		type: 'valueAsBoolean'
	},
	Omnichannel_call_provider: {
		type: 'valueAsBoolean'
	},
	CDN_PREFIX: {
		type: 'valueAsString'
	},
	Accounts_RequirePasswordConfirmation: {
		type: 'valueAsBoolean'
	},
	Accounts_ConfirmPasswordPlaceholder: {
		type: 'valueAsString'
	},
	E2E_Enabled_Mentions: {
		type: 'valueAsBoolean'
	},
	UTF8_User_Names_Validation: {
		type: 'valueAsString'
	},
	Cloud_Workspace_AirGapped_Restrictions_Remaining_Days: {
		type: 'valueAsNumber'
	},
	...deprecatedSettings
} as const;
