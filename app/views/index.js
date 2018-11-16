import { Navigation } from 'react-native-navigation';
import { Provider } from 'react-redux';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';

import OnboardingView from './OnboardingView';
import ProfileView from './ProfileView';
import RoomsListHeaderView from './RoomsListView/Header';
import RoomsListView from './RoomsListView';
import RoomView from './RoomView';
import RoomHeaderView from './RoomView/Header';
import SettingsView from './SettingsView';
import Sidebar from '../containers/Sidebar';

export const registerScreens = (store) => {
	Navigation.registerComponentWithRedux('OnboardingView', () => gestureHandlerRootHOC(OnboardingView), Provider, store);
	Navigation.registerComponentWithRedux('ProfileView', () => gestureHandlerRootHOC(ProfileView), Provider, store);
	Navigation.registerComponentWithRedux('RoomsListHeaderView', () => gestureHandlerRootHOC(RoomsListHeaderView), Provider, store);
	Navigation.registerComponentWithRedux('RoomsListView', () => gestureHandlerRootHOC(RoomsListView), Provider, store);
	Navigation.registerComponentWithRedux('RoomView', () => gestureHandlerRootHOC(RoomView), Provider, store);
	Navigation.registerComponentWithRedux('RoomHeaderView', () => gestureHandlerRootHOC(RoomHeaderView), Provider, store);
	Navigation.registerComponentWithRedux('SettingsView', () => gestureHandlerRootHOC(SettingsView), Provider, store);
	Navigation.registerComponentWithRedux('Sidebar', () => gestureHandlerRootHOC(Sidebar), Provider, store);
};
