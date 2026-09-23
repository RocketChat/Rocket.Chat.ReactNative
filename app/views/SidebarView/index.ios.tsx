import { useEffect, useState } from 'react';
import { type DrawerNavigationProp } from '@react-navigation/drawer';
import { View } from 'react-native';

import * as List from '~/containers/List';
import styles from './styles';
import { type DrawerParamList } from '~/stacks/types';
import SupportedVersionsWarnItem, { useIsSupportedVersionsWarnVisible } from './components/SupportedVersionsWarnItem';
import CustomStatus, { useIsCustomStatusVisible } from './components/CustomStatus';
import StackItem from './components/StackItem';
import { useStackItems } from './components/useStackItems';
import Admin, { useIsAdmin } from './components/Admin';
import Profile from './components/Profile';

const SidebarView = ({ navigation }: { navigation: DrawerNavigationProp<DrawerParamList> }) => {
	const [currentScreen, setCurrentScreen] = useState<string | null>(null);
	const isSupportedVersionsWarnVisible = useIsSupportedVersionsWarnVisible();
	const isCustomStatusVisible = useIsCustomStatusVisible();
	const stackItems = useStackItems(currentScreen);
	const isAdmin = useIsAdmin();

	useEffect(() => {
		const unsubscribe = navigation.addListener('state', () => {
			setCurrentScreen(navigation.getState().routes[navigation.getState().index].name);
		});

		return unsubscribe;
	}, [navigation]);

	return (
		<View testID='sidebar-view' style={styles.container}>
			<List.Container>
				<List.Section>
					<Profile navigation={navigation} />
				</List.Section>
				{isSupportedVersionsWarnVisible || isCustomStatusVisible ? (
					<List.Section>
						{isSupportedVersionsWarnVisible ? <SupportedVersionsWarnItem /> : null}
						{isCustomStatusVisible ? <CustomStatus /> : null}
					</List.Section>
				) : null}
				{stackItems.length ? (
					<List.Section>
						{stackItems.map(item => (
							<StackItem key={item.testID} item={item} />
						))}
					</List.Section>
				) : null}
				{isAdmin ? (
					<List.Section>
						<Admin currentScreen={currentScreen} />
					</List.Section>
				) : null}
			</List.Container>
		</View>
	);
};

export default SidebarView;
