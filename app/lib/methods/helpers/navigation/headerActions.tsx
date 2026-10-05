import { type ReactElement } from 'react';
import { DrawerActions, type NavigationProp, type ParamListBase } from '@react-navigation/native';
import {
	type NativeStackHeaderItem,
	type NativeStackHeaderItemMenuAction,
	type NativeStackNavigationOptions
} from '@react-navigation/native-stack';

import { showActionSheetRef } from '~/containers/ActionSheet';
import { type TIconsName } from '~/containers/CustomIcon';
import * as HeaderButton from '~/containers/Header/components/HeaderButton';
import Radio from '~/containers/Radio';
import { hasNativeHeaderBar } from '~/lib/methods/helpers/deviceInfo';
import I18n from '~/i18n';
import { headerIcon } from './headerIcon';

export interface IHeaderMenuItem {
	label: string;
	icon?: TIconsName;
	checked?: boolean;
	destructive?: boolean;
	disabled?: boolean;
	testID?: string;
	onPress: () => void;
}

export interface IHeaderActionBadge {
	value?: number;
	color: string;
}

export interface IHeaderAction {
	label: string;
	icon?: TIconsName;
	testID?: string;
	disabled?: boolean;
	tintColor?: string;
	badge?: IHeaderActionBadge;
	legacyHeaderOnly?: boolean;
	onPress?: () => void;
	menu?: IHeaderMenuItem[];
}

const toNativeMenuAction = ({
	label,
	icon,
	checked,
	destructive,
	disabled,
	onPress
}: IHeaderMenuItem): NativeStackHeaderItemMenuAction => ({
	type: 'action',
	label,
	icon: icon && headerIcon(icon),
	state: checked === undefined ? undefined : checked ? 'on' : 'off',
	destructive,
	disabled,
	onPress
});

export const nativeHeaderItems = (actions: IHeaderAction[]): NativeStackHeaderItem[] =>
	actions
		.filter(action => !action.legacyHeaderOnly)
		.map(({ label, icon, disabled, tintColor, badge, onPress, menu }): NativeStackHeaderItem => {
			const item = {
				label,
				accessibilityLabel: label,
				icon: icon && headerIcon(icon),
				disabled,
				tintColor,
				badge: badge && { value: badge.value ?? '', style: { backgroundColor: badge.color } }
			};
			if (menu) {
				return { ...item, type: 'menu', menu: { items: menu.map(toNativeMenuAction) } };
			}
			return { ...item, type: 'button', onPress: onPress ?? (() => {}) };
		});

const showMenu = (menu: IHeaderMenuItem[]) =>
	showActionSheetRef({
		options: menu.map(({ label, icon, checked, destructive, disabled, testID, onPress }) => ({
			title: label,
			icon,
			danger: destructive,
			enabled: !disabled,
			testID,
			onPress,
			right: checked === undefined ? undefined : () => <Radio check={checked} />
		}))
	});

const renderBadge = ({ value, color }: IHeaderActionBadge) =>
	value === undefined ? <HeaderButton.BadgeWarn color={color} /> : <HeaderButton.BadgeCount value={value} color={color} />;

export const HeaderActions = ({ actions, left = false }: { actions: IHeaderAction[]; left?: boolean }): ReactElement | null => {
	if (!actions.length) {
		return null;
	}
	return (
		<HeaderButton.Container left={left}>
			{actions.map(({ label, icon, testID, disabled, tintColor, badge, onPress, menu }) => (
				<HeaderButton.Item
					key={testID ?? label}
					iconName={icon}
					title={icon ? undefined : label}
					accessibilityLabel={label}
					testID={testID}
					color={tintColor}
					disabled={disabled}
					badge={badge ? () => renderBadge(badge) : undefined}
					onPress={() => {
						onPress?.();
						if (menu) {
							showMenu(menu);
						}
					}}
				/>
			))}
		</HeaderButton.Container>
	);
};

export const headerRightActions = (actions: IHeaderAction[]): NativeStackNavigationOptions =>
	hasNativeHeaderBar
		? { headerRight: undefined, unstable_headerRightItems: () => nativeHeaderItems(actions) }
		: { headerRight: () => <HeaderActions actions={actions} /> };

export const headerLeftActions = (actions: IHeaderAction[]): NativeStackNavigationOptions =>
	hasNativeHeaderBar
		? { headerLeft: undefined, unstable_headerLeftItems: () => nativeHeaderItems(actions) }
		: { headerLeft: () => <HeaderActions actions={actions} left /> };

export const headerLeftDrawer = (
	navigation: Pick<NavigationProp<ParamListBase>, 'dispatch'>,
	testID?: string
): NativeStackNavigationOptions => {
	const toggleDrawer = () => navigation.dispatch(DrawerActions.toggleDrawer());
	return hasNativeHeaderBar
		? headerLeftActions([{ label: I18n.t('Menu'), icon: 'hamburguer', onPress: toggleDrawer }])
		: { headerLeft: () => <HeaderButton.Drawer testID={testID} onPress={toggleDrawer} /> };
};
