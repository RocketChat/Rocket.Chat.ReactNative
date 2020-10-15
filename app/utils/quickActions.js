import { DeviceEventEmitter } from 'react-native';
import QuickActions from 'react-native-quick-actions';

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
	ADD_SERVER: 'WorkspaceView',
	SEARCH_ROOM: 'NewMessageView'
};

export default function configQuickActions(props) {
	QuickActions.setShortcutItems([AddServerAction, SearchRoomAction]);

	DeviceEventEmitter.addListener('quickActionShortcut', ({ type }) => {
		props.navigation.navigate(mappedActionWithView[type], props);
	});
}
