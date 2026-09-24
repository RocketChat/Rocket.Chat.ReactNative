import { type TIconsName } from '~/containers/CustomIcon';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { useNewMediaCall } from '~/lib/hooks/useNewMediaCall';
import { sidebarNavigate } from '../methods/sidebarNavigate';

export interface IStackItem {
	title: string;
	icon: TIconsName;
	testID: string;
	onPress: () => void;
	selected: boolean;
	route?: string;
	disabled?: boolean;
}

export const useStackItems = (currentScreen: string | null): IStackItem[] => {
	const isMasterDetail = useMasterDetail();
	const { openNewMediaCall, hasMediaCallPermission, isInActiveCall } = useNewMediaCall();

	if (isMasterDetail) {
		return [];
	}

	const routeItem = (title: string, icon: TIconsName, testID: string, route: string): IStackItem => ({
		title,
		icon,
		testID,
		onPress: () => sidebarNavigate(route),
		selected: currentScreen === route,
		route
	});

	const mediaCallItems: IStackItem[] = hasMediaCallPermission
		? [
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
