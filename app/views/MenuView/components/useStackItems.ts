import { type TIconsName } from '~/containers/CustomIcon';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { useNewMediaCall } from '~/lib/hooks/useNewMediaCall';
import { menuNavigate } from '../methods/menuNavigate';

export interface IStackItem {
	title: string;
	icon: TIconsName;
	testID: string;
	onPress: () => void;
	disabled?: boolean;
}

export const useStackItems = (): IStackItem[] => {
	const isMasterDetail = useMasterDetail();
	const { openNewMediaCall, hasMediaCallPermission, isInActiveCall } = useNewMediaCall();

	if (isMasterDetail) {
		return [];
	}

	const routeItem = (title: string, icon: TIconsName, testID: string, route: string): IStackItem => ({
		title,
		icon,
		testID,
		onPress: () => menuNavigate(route)
	});

	const mediaCallItems: IStackItem[] = hasMediaCallPermission
		? [
				{
					title: 'Voice_call',
					icon: 'phone',
					testID: 'sidebar-media-call',
					onPress: openNewMediaCall,
					disabled: isInActiveCall
				}
			]
		: [];

	return [
		...mediaCallItems,
		routeItem('Profile', 'user', 'sidebar-profile', 'ProfileView'),
		routeItem('Accessibility_and_Appearance', 'accessibility', 'sidebar-accessibility', 'AccessibilityAndAppearanceView'),
		routeItem('Settings', 'administration', 'sidebar-settings', 'SettingsView')
	];
};
