import { type DrawerNavigationProp } from '@react-navigation/drawer';

import * as List from '~/containers/List';
import ListContainer from '~/containers/List/components/ListContainer.ios';
import { type DrawerParamList } from '~/stacks/types';
import SupportedVersionsWarnItem, { useIsSupportedVersionsWarnVisible } from './components/SupportedVersionsWarnItem';
import CustomStatus, { useIsCustomStatusVisible } from './components/CustomStatus';
import { useStackItems } from './components/useStackItems';
import { useAdminRoute, useIsAdmin } from './components/Admin';
import { sidebarNavigate } from './methods/sidebarNavigate';
import Profile from './components/Profile';
import { useSidebarAppActions } from './components/useSidebarAppActions';
import { useCurrentScreen } from './useCurrentScreen';

const SidebarSections = ({ navigation }: { navigation: DrawerNavigationProp<DrawerParamList> }) => {
	const currentScreen = useCurrentScreen(navigation);
	const isSupportedVersionsWarnVisible = useIsSupportedVersionsWarnVisible();
	const isCustomStatusVisible = useIsCustomStatusVisible();
	const stackItems = useStackItems(currentScreen);
	const isAdmin = useIsAdmin();
	const adminRoute = useAdminRoute();
	const appActions = useSidebarAppActions();

	return (
		<ListContainer>
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
						<List.Item
							key={item.testID}
							title={item.title}
							left={() => <List.Icon name={item.icon} />}
							onPress={item.onPress}
							testID={item.testID}
							disabled={item.disabled}
							selected={item.selected}
						/>
					))}
				</List.Section>
			) : null}
			{isAdmin ? (
				<List.Section>
					<List.Item
						title='Admin_Panel'
						testID='sidebar-admin'
						selected={currentScreen === adminRoute}
						left={() => <List.Icon name='settings' />}
						onPress={() => sidebarNavigate(adminRoute)}
					/>
				</List.Section>
			) : null}
			{appActions.length ? (
				<List.Section title='Apps'>
					{appActions.map(item => (
						<List.Item
							key={item.id}
							title={item.title}
							translateTitle={false}
							left={() => <List.Icon name='apps' />}
							onPress={item.onPress}
							testID={item.testID}
						/>
					))}
				</List.Section>
			) : null}
		</ListContainer>
	);
};

export default SidebarSections;
