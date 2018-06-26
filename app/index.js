import { AsyncStorage, Linking } from 'react-native';
import { Navigation } from 'react-native-navigation';

import RocketChat from './lib/rocketchat';
import store from './lib/createStore';
import { appInit } from './actions';
import database from './lib/realm';
import { iconsLoaded } from './Icons';
import { registerScreens } from './views';
import { deepLinkingOpen } from './actions/deepLinking';
import parseQuery from './lib/methods/helpers/parseQuery';

const startLogged = () => {
	Navigation.startSingleScreenApp({
		screen: {
			screen: 'RoomsListView'
		},
		drawer: {
			left: {
				screen: 'Sidebar'
			}
		}
	});
};

const startNotLogged = (route) => {
	Navigation.startSingleScreenApp({
		screen: {
			screen: route,
			title: route === 'NewServerView' ? 'New Server' : 'Servers'
		}
	});
};

const hasServers = () => {
	const db = database.databases.serversDB.objects('servers');
	return db.length > 0;
};

const handleOpenURL = ({ url }) => {
	if (url) {
		url = url.replace(/rocketchat:\/\/|https:\/\/go.rocket.chat\//, '');
		const regex = /^(room|auth)\?/;
		if (url.match(regex)) {
			url = url.replace(regex, '');
			const params = parseQuery(url);
			// console.warn(props)
			store.dispatch(deepLinkingOpen(params));
		}
	}
};

export async function start() {
	registerScreens(store);
	store.dispatch(appInit());
	await iconsLoaded();

	Linking
		.getInitialURL()
		.then(url => handleOpenURL({ url }))
		.catch(e => console.warn(e));
	Linking.addEventListener('url', handleOpenURL);

	const token = await AsyncStorage.getItem(RocketChat.TOKEN_KEY);
	if (token) {
		return startLogged();
	}
	if (hasServers()) {
		startNotLogged('ListServerView');
	} else {
		startNotLogged('NewServerView');
	}
}
