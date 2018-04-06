import { NavigationActions } from 'react-navigation';
import { Answers } from 'react-native-fabric';

const config = {};

export function setNavigator(nav) {
	if (nav) {
		config.navigator = nav;
	}
}

export function navigate(routeName, params) {
	if (config.navigator && routeName) {
		Answers.logContentView(routeName);
		const action = NavigationActions.navigate({ routeName, params });
		config.navigator.dispatch(action);
	}
}

export function goBack() {
	if (config.navigator) {
		const action = NavigationActions.back({});
		config.navigator.dispatch(action);
	}
}

export function goRoomsList() {
	if (config.navigator) {
		Answers.logContentView('RoomsList');
		const action = NavigationActions.reset({
			index: 0,
			actions: [NavigationActions.navigate({ routeName: 'RoomsList' })]
		});
		config.navigator.dispatch(action);
	}
}

export function goRoom({ rid, name }, counter = 0) {
	// about counter: we can call this method before navigator be set. so we have to wait, if we tried a lot, we give up ...
	if (!rid || !name || counter > 10) {
		return;
	}
	if (!config.navigator) {
		return setTimeout(() => goRoom({ rid, name }, counter + 1), 100);
	}

	const action = NavigationActions.reset({
		index: 1,
		actions: [
			NavigationActions.navigate({ routeName: 'RoomsList' }),
			NavigationActions.navigate({ routeName: 'Room', params: { room: { rid, name }, rid, name } })
		]
	});
	Answers.logContentView('Room');
	config.navigator.dispatch(action);
}
