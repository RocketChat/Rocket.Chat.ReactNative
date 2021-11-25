const commonOptions = [
	{
		label: 'Default',
		value: 'default'
	},
	{
		label: 'All_Messages',
		value: 'all'
	},
	{
		label: 'Mentions',
		value: 'mentions'
	},
	{
		label: 'Nothing',
		value: 'nothing'
	}
];

export const OPTIONS = {
	desktopNotifications: commonOptions,
	pushNotifications: commonOptions,
	emailNotificationMode: [
		{
			label: 'Email_Notification_Mode_All',
			value: 'mentions'
		},
		{
			label: 'Email_Notification_Mode_Disabled',
			value: 'nothing'
		}
	]
};
