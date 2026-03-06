import { useTheme } from '../../../theme';
import * as List from '../../../containers/List';
import { sidebarNavigate } from '../methods/sidebarNavigate';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { useNewMediaCallWithoutRoom } from '../../../lib/hooks/useNewMediaCall';

const Stacks = ({ currentScreen }: { currentScreen: string | null }) => {
	'use memo';

	const { colors } = useTheme();
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);
	const { openNewMediaCall, hasMediaCallPermission } = useNewMediaCallWithoutRoom();

	if (isMasterDetail) {
		return null;
	}

	return (
		<>
			<List.Item
				title={'Chats'}
				left={() => <List.Icon name='message' />}
				onPress={() => sidebarNavigate('ChatsStackNavigator')}
				backgroundColor={currentScreen === 'ChatsStackNavigator' ? colors.strokeLight : undefined}
				testID='sidebar-chats'
			/>
			<List.Separator />
			{hasMediaCallPermission ? (
				<>
					<List.Item
						title={'Voice_call'}
						left={() => <List.Icon name='phone' />}
						onPress={openNewMediaCall}
						testID='sidebar-media-call'
					/>
					<List.Separator />
				</>
			) : null}
			<List.Item
				title={'Profile'}
				left={() => <List.Icon name='user' />}
				onPress={() => sidebarNavigate('ProfileStackNavigator')}
				backgroundColor={currentScreen === 'ProfileStackNavigator' ? colors.strokeLight : undefined}
				testID='sidebar-profile'
			/>
			<List.Separator />
			<List.Item
				title={'Accessibility_and_Appearance'}
				left={() => <List.Icon name='accessibility' />}
				onPress={() => sidebarNavigate('AccessibilityStackNavigator')}
				backgroundColor={currentScreen === 'AccessibilityStackNavigator' ? colors.strokeLight : undefined}
				testID='sidebar-accessibility'
			/>
			<List.Separator />
			<List.Item
				title={'Settings'}
				left={() => <List.Icon name='administration' />}
				onPress={() => sidebarNavigate('SettingsStackNavigator')}
				backgroundColor={currentScreen === 'SettingsStackNavigator' ? colors.strokeLight : undefined}
				testID='sidebar-settings'
			/>
			<List.Separator />
		</>
	);
};
export default Stacks;
