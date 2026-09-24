import { useEffect, useState } from 'react';
import { type DrawerNavigationProp } from '@react-navigation/drawer';
import { View } from 'react-native';

import * as List from '~/containers/List';
import ListContainer from '~/containers/List/ListContainer.ios';
import styles from './styles';
import { type DrawerParamList } from '~/stacks/types';
import SupportedVersionsWarnItem, { useIsSupportedVersionsWarnVisible } from './components/SupportedVersionsWarnItem';
import CustomStatus, { useIsCustomStatusVisible } from './components/CustomStatus';
import StackItem from './components/StackItem';
import { useStackItems } from './components/useStackItems';
import { ADMIN_SELECTION_TAG, getSidebarSelection } from './components/getSidebarSelection';
import Admin, { useAdminRoute, useIsAdmin } from './components/Admin';
import Profile from './components/Profile';

const currentRouteName = (navigation: DrawerNavigationProp<DrawerParamList>) => {
	const state = navigation.getState();
	return state.routes[state.index].name;
};

const SidebarView = ({ navigation }: { navigation: DrawerNavigationProp<DrawerParamList> }) => {
	const [currentScreen, setCurrentScreen] = useState<string | null>(() => currentRouteName(navigation));
	const isSupportedVersionsWarnVisible = useIsSupportedVersionsWarnVisible();
	const isCustomStatusVisible = useIsCustomStatusVisible();
	const stackItems = useStackItems(currentScreen);
	const isAdmin = useIsAdmin();
	const adminRoute = useAdminRoute();
	const selection = getSidebarSelection(stackItems, isAdmin ? adminRoute : null, currentScreen);

	useEffect(() => {
		const unsubscribe = navigation.addListener('state', () => {
			setCurrentScreen(currentRouteName(navigation));
		});

		return unsubscribe;
	}, [navigation]);

	return (
		<View testID='sidebar-view' style={styles.container}>
			<ListContainer selection={selection}>
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
							<StackItem key={item.testID} item={item} selectionTag={item.route ? item.testID : undefined} />
						))}
					</List.Section>
				) : null}
				{isAdmin ? (
					<List.Section>
						<Admin currentScreen={currentScreen} selectionTag={ADMIN_SELECTION_TAG} />
					</List.Section>
				) : null}
			</ListContainer>
		</View>
	);
};

export default SidebarView;
