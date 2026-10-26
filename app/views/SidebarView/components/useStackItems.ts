import { type TIconsName } from '~/containers/CustomIcon';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { useNewMediaCall } from '~/lib/hooks/useNewMediaCall';
import { mediaSessionInstance } from '~/lib/services/voip/MediaSessionInstance';
import { useCanTakeOverCall } from '~/lib/services/voip/useCanTakeOverCall';
import log from '~/lib/methods/helpers/log';
import { sidebarNavigate } from '../methods/sidebarNavigate';

export interface IStackItem {
	title: string;
	icon: TIconsName;
	testID: string;
	onPress: () => void;
	selected: boolean;
	disabled?: boolean;
}

export const useStackItems = (currentScreen: string): IStackItem[] => {
	const isMasterDetail = useMasterDetail();
	const { openNewMediaCall, hasMediaCallPermission, isInActiveCall } = useNewMediaCall();
	const canTakeOverCall = useCanTakeOverCall();

	if (isMasterDetail) {
		return [];
	}

	const routeItem = (title: string, icon: TIconsName, testID: string, route: string): IStackItem => ({
		title,
		icon,
		testID,
		onPress: () => sidebarNavigate(route),
		selected: currentScreen === route
	});

	const takeOverItems: IStackItem[] = canTakeOverCall
		? [
				{
					title: 'Continue_call_here',
					icon: 'phone-in',
					testID: 'sidebar-media-call-take-over',
					onPress: () => {
						mediaSessionInstance.takeOverCall().catch(log);
					},
					selected: false
				}
			]
		: [];

	const mediaCallItems: IStackItem[] = hasMediaCallPermission
		? [
				...takeOverItems,
				{
					title: 'Voice_call',
					icon: 'phone',
					testID: 'sidebar-media-call',
					onPress: openNewMediaCall,
					selected: false,
					disabled: isInActiveCall
				}
			]
		: [];

	return [
		routeItem('Chats', 'message', 'sidebar-chats', 'ChatsStackNavigator'),
		...mediaCallItems,
		routeItem('Profile', 'user', 'sidebar-profile', 'ProfileStackNavigator'),
		routeItem('Accessibility_and_Appearance', 'accessibility', 'sidebar-accessibility', 'AccessibilityStackNavigator'),
		routeItem('Settings', 'administration', 'sidebar-settings', 'SettingsStackNavigator')
	];
};
