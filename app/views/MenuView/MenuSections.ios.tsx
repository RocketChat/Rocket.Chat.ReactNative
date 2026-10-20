import * as List from '~/containers/List';
import SupportedVersionsWarnItem, { useIsSupportedVersionsWarnVisible } from './components/SupportedVersionsWarnItem';
import CustomStatus, { useIsCustomStatusVisible } from './components/CustomStatus';
import { useStackItems } from './components/useStackItems';
import { useIsAdmin } from './components/Admin';
import { menuNavigate } from './methods/menuNavigate';
import Profile from './components/Profile';

const MenuSections = () => {
	const isSupportedVersionsWarnVisible = useIsSupportedVersionsWarnVisible();
	const isCustomStatusVisible = useIsCustomStatusVisible();
	const stackItems = useStackItems();
	const isAdmin = useIsAdmin();

	return (
		<>
			<List.Section>
				<Profile />
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
						/>
					))}
				</List.Section>
			) : null}
			{isAdmin ? (
				<List.Section>
					<List.Item
						title='Admin_Panel'
						testID='sidebar-admin'
						left={() => <List.Icon name='settings' />}
						onPress={() => menuNavigate('AdminPanelView')}
					/>
				</List.Section>
			) : null}
		</>
	);
};

export default MenuSections;
