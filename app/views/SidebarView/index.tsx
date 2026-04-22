import { useEffect, useState } from 'react';
import { type DrawerNavigationProp } from '@react-navigation/drawer';
import { ScrollView } from 'react-native';

import scrollPersistTaps from '../../lib/methods/helpers/scrollPersistTaps';
import styles from './styles';
import { type DrawerParamList } from '../../stacks/types';
import SupportedVersionsWarnItem from './components/SupportedVersionsWarnItem';
import CustomStatus from './components/CustomStatus';
import Stacks from './components/Stacks';
import Admin from './components/Admin';
import Profile from './components/Profile';

const SidebarView = ({ navigation }: { navigation: DrawerNavigationProp<DrawerParamList> }) => {
	'use memo';

	const [currentScreen, setCurrentScreen] = useState<string | null>(null);

	useEffect(() => {
		const unsubscribe = navigation.addListener('state', () => {
			setCurrentScreen(navigation.getState().routes[navigation.getState().index].name);
		});

		return unsubscribe;
	}, [navigation]);

	return (
		<ScrollView style={styles.container} {...scrollPersistTaps}>
			<Profile navigation={navigation} />
			<SupportedVersionsWarnItem />
			<CustomStatus />
			<Stacks currentScreen={currentScreen} />
			<Admin currentScreen={currentScreen} />
		</ScrollView>
	);
};

export default SidebarView;
