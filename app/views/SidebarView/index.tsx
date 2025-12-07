import { memo, useEffect, useState } from 'react';
import { type DrawerNavigationProp } from '@react-navigation/drawer';
import { ScrollView } from 'react-native';

import scrollPersistTaps from '../../lib/methods/helpers/scrollPersistTaps';
import SafeAreaView from '../../containers/SafeAreaView';
import styles from './styles';
import { type DrawerParamList } from '../../stacks/types';
import SupportedVersionsWarnItem from './components/SupportedVersionsWarnItem';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import CustomStatus from './components/CustomStatus';
import Stacks from './components/Stacks';
import Admin from './components/Admin';
import Profile from './components/Profile';

const SidebarView = ({ navigation }: { navigation: DrawerNavigationProp<DrawerParamList> }) => {
	'use memo';

	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);
	const [currentScreen, setCurrentScreen] = useState<string | null>(null);

	useEffect(() => {
		const unsubscribe = navigation.addListener('state', () => {
			setCurrentScreen(navigation.getState().routes[navigation.getState().index].name);
		});

		return unsubscribe;
	}, [navigation]);

	return (
		<SafeAreaView testID='sidebar-view' vertical={isMasterDetail}>
			<ScrollView style={styles.container} {...scrollPersistTaps}>
				<Profile navigation={navigation} />
				<SupportedVersionsWarnItem />
				<CustomStatus />
				<Stacks currentScreen={currentScreen} />
				<Admin currentScreen={currentScreen} />
			</ScrollView>
		</SafeAreaView>
	);
};

export default memo(SidebarView);
