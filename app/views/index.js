import { Navigation } from 'react-native-navigation';
import { Provider } from 'react-redux';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';

import OnboardingView from './OnboardingView';
import ProfileView from './ProfileView';
import RoomsListHeaderView from './RoomsListView/Header';
import RoomsListSearchView from './RoomsListView/Search';
import RoomsListView from './RoomsListView';
import RoomView from './RoomView';
import SettingsView from './SettingsView';
import Sidebar from '../containers/Sidebar';

export const registerScreens = (store) => {
	Navigation.registerComponentWithRedux('OnboardingView', () => OnboardingView, Provider, store);
	Navigation.registerComponentWithRedux('ProfileView', () => ProfileView, Provider, store);
	Navigation.registerComponentWithRedux('RoomsListHeaderView', () => RoomsListHeaderView, Provider, store);
	Navigation.registerComponentWithRedux('RoomsListSearchView', () => RoomsListSearchView, Provider, store);
	Navigation.registerComponentWithRedux('RoomsListView', () => gestureHandlerRootHOC(RoomsListView), Provider, store);
	Navigation.registerComponentWithRedux('RoomView', () => gestureHandlerRootHOC(RoomView), Provider, store);
	Navigation.registerComponentWithRedux('SettingsView', () => SettingsView, Provider, store);
	Navigation.registerComponentWithRedux('Sidebar', () => Sidebar, Provider, store);
};
