import { SizeTypes } from './interfaces';

export const largeTiles = [
	{
		title: 'Peer Supporter Library',
		screen: 'ProfileLibraryView',
		size: SizeTypes.LARGE,
		color: 'mossGreen',
		icon: require('../../static/images/peer-supporter-solid.png'),
		disabled: false
	},
	{
		title: '24/7 Chat Room',
		screen: '24Chat',
		size: SizeTypes.LARGE,
		color: 'magenta',
		icon: require('../../static/images/24-7-solid.png'),
		disabled: false
	}
];

export const smallTiles = [
	{
		title: 'Discussion Boards',
		screen: 'DiscussionHomeView',
		size: SizeTypes.SMALL,
		color: 'dreamBlue',
		icon: require('../../static/images/discussion-solid.png'),
		disabled: false
	},
	{
		title: 'Virtual Happy Hour',
		screen: 'VirtualHappyHour',
		size: SizeTypes.SMALL,
		color: 'creamsicleYellow',
		icon: require('../../static/images/happy-hour-solid.png'),
		disabled: false
	},
	{
		title: 'Calendar',
		screen: 'CalendarView',
		size: SizeTypes.SMALL,
		color: 'pink',
		icon: require('../../static/images/calendar-solid.png'),
		disabled: false
	},
	{
		title: 'Direct Messaging',
		screen: 'RoomsListView',
		size: SizeTypes.SMALL,
		color: 'pink',
		icon: require('../../static/images/messaging-solid.png'),
		disabled: false
	},
	{
		title: 'Tech Support',
		screen: 'TechSupport',
		size: SizeTypes.SMALL,
		color: 'magenta',
		icon: require('../../static/images/support-solid.png'),
		disabled: false
	},
	{
		title: 'Settings',
		screen: 'SettingsView',
		size: SizeTypes.SMALL,
		color: 'creamsicleYellow',
		icon: require('../../static/images/settings-solid.png'),
		disabled: false
	}
];
