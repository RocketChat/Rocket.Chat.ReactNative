import { DeviceEventEmitter } from 'react-native';
import QuickActions from 'react-native-quick-actions';

import Navigation from '../lib/Navigation';

const ADD_SERVER = 'ADD_SERVER';
const SEARCH_ROOM = 'SEARCH_ROOM';

const AddServerAction = {
	type: ADD_SERVER,
	title: 'Add Server',
	icon: 'Add',
	userInfo: {
		url: ''
	}
};

const SearchRoomAction = {
	type: SEARCH_ROOM,
	title: 'Search Rooms',
	icon: 'Compose',
	userInfo: {
		url: ''
	}
};

const mappedActionWithView = {
	ADD_SERVER: { stack: 'OutsideStack', screen: 'WorkspaceView' },
	SEARCH_ROOM: { stack: 'NewMessageStackNavigator', screen: 'NewMessageView' }
};

export default function configQuickActions(props) {
	QuickActions.setShortcutItems([AddServerAction, SearchRoomAction]);

	DeviceEventEmitter.addListener('quickActionShortcut', ({ type }) => {
		Navigation.navigate(mappedActionWithView[type].stack, { screen: mappedActionWithView[type].screen, ...props });
	});
}
