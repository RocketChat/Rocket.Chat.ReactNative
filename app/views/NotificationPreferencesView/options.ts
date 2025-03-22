export interface IOptionsField {
	label: string;
	value: string | number;
	second?: number;
}
export interface INotificationOptions {
	desktopNotifications: IOptionsField[];
	mobilePushNotifications: IOptionsField[];
	emailNotifications: IOptionsField[];
	audioNotificationValue: IOptionsField[];
}

export const OPTIONS: INotificationOptions = {
	desktopNotifications: [
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
	],
	mobilePushNotifications: [
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
	],
	emailNotifications: [
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
	],
	audioNotificationValue: [
		{
			label: 'None',
			value: 'none None'
		},
		{
			label: 'Default',
			value: '0 Default'
		},
		{
			label: 'Beep',
			value: 'beep Beep'
		},
		{
			label: 'Ding',
			value: 'ding Ding'
		},
		{
			label: 'Chelle',
			value: 'chelle Chelle'
		},
		{
			label: 'Droplet',
			value: 'droplet Droplet'
		},
		{
			label: 'Highbell',
			value: 'highbell Highbell'
		},
		{
			label: 'Seasons',
			value: 'seasons Seasons'
		}
	]
};
