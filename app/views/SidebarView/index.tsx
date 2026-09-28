import { useEffect, useState } from 'react';
import { type DrawerNavigationProp } from '@react-navigation/drawer';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import scrollPersistTaps from '~/lib/methods/helpers/scrollPersistTaps';
import styles from './styles';
import { type DrawerParamList } from '~/stacks/types';
import SupportedVersionsWarnItem from './components/SupportedVersionsWarnItem';
import CustomStatus from './components/CustomStatus';
import Stacks from './components/Stacks';
import Admin from './components/Admin';
import Profile from './components/Profile';

const SidebarView = ({ navigation }: { navigation: DrawerNavigationProp<DrawerParamList> }) => {
	const { top } = useSafeAreaInsets();
	const [currentScreen, setCurrentScreen] = useState<string | null>(null);

	useEffect(() => {
		const unsubscribe = navigation.addListener('state', () => {
			setCurrentScreen(navigation.getState().routes[navigation.getState().index].name);
		});

		return unsubscribe;
	}, [navigation]);

	return (
		<View testID='sidebar-view' style={styles.container}>
			<ScrollView
				style={styles.container}
				contentContainerStyle={{ paddingTop: top }}
				contentInsetAdjustmentBehavior='never'
				{...scrollPersistTaps}>
				<Profile navigation={navigation} />
				<SupportedVersionsWarnItem />
				<CustomStatus />
				<Stacks currentScreen={currentScreen} />
				<Admin currentScreen={currentScreen} />
			</ScrollView>
		</View>
	);
};

export default SidebarView;
