import { Platform } from 'react-native';
import { Navigation } from 'react-native-navigation';
import { Provider } from 'react-redux';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';

import OnboardingView from './OnboardingView';
import ProfileView from './ProfileView';
import RoomsListHeaderView from './RoomsListView/Header';
import RoomsListView from './RoomsListView';
import RoomView from './RoomView';
import SettingsView from './SettingsView';
import Sidebar from '../containers/Sidebar';

export const registerScreens = (store) => {
	Navigation.registerComponent('OnboardingView', () => OnboardingView, store, Provider);
	Navigation.registerComponent('ProfileView', () => ProfileView, store, Provider);
	Navigation.registerComponent('RoomsListHeaderView', () => RoomsListHeaderView, store, Provider);

	if (Platform.OS === 'android') {
		const RoomsListSearchView = require('./RoomsListView/Search');
		Navigation.registerComponent('RoomsListSearchView', () => RoomsListSearchView, store, Provider);
	}

	Navigation.registerComponent('RoomsListView', () => gestureHandlerRootHOC(RoomsListView), store, Provider);
	Navigation.registerComponent('RoomView', () => gestureHandlerRootHOC(RoomView), store, Provider);
	Navigation.registerComponent('SettingsView', () => SettingsView, store, Provider);
	Navigation.registerComponent('Sidebar', () => Sidebar, store, Provider);
};
