import { Fragment, type ReactElement } from 'react';
import { Platform } from 'react-native';
import {
	type NativeStackHeaderItem,
	type NativeStackHeaderItemButton,
	type NativeStackHeaderItemCustom,
	type NativeStackHeaderItemMenu,
	type NativeStackNavigationOptions
} from '@react-navigation/native-stack';

import { type TIconsName } from '~/containers/CustomIcon';
import * as HeaderButton from '~/containers/Header/components/HeaderButton';

export type HeaderAction =
	| (NativeStackHeaderItemButton & {
			iconName?: keyof typeof symbols;
			testID?: string;
			androidBadge?: () => ReactElement | null;
			androidElement?: ReactElement;
	  })
	| NativeStackHeaderItemCustom
	| (NativeStackHeaderItemMenu & { androidElement: ReactElement });

const symbols = {
	add: 'plus',
	close: 'xmark',
	'chevron-left': 'chevron.left',
	phone: 'phone',
	create: 'square.and.pencil',
	directory: 'book',
	download: 'arrow.down.to.line',
	edit: 'pencil',
	encrypted: 'lock',
	filter: 'line.3.horizontal.decrease',
	hamburguer: 'line.3.horizontal',
	kebab: 'ellipsis',
	notification: 'bell',
	'notification-disabled': 'bell.slash',
	search: 'magnifyingglass',
	settings: 'gearshape',
	threads: 'bubble.left.and.bubble.right'
} satisfies Partial<Record<TIconsName, Extract<NonNullable<NativeStackHeaderItemButton['icon']>, { type: 'sfSymbol' }>['name']>>;

const nativeItem = (action: HeaderAction): NativeStackHeaderItem => {
	if (action.type === 'custom') {
		return action;
	}
	if (action.type === 'menu') {
		const item: NativeStackHeaderItemMenu & { androidElement?: ReactElement } = { ...action };
		delete item.androidElement;
		return item;
	}
	if (action.badge && action.androidBadge && Number.parseInt(String(Platform.Version), 10) < 26) {
		return { type: 'custom', element: renderAction(action) };
	}
	const item = { ...action };
	const symbol = item.iconName && symbols[item.iconName];
	delete item.iconName;
	delete item.testID;
	delete item.androidElement;
	delete item.androidBadge;
	return {
		...item,
		accessibilityLabel: item.accessibilityLabel ?? item.label,
		icon: item.icon ?? (symbol ? { type: 'sfSymbol', name: symbol } : undefined)
	};
};

const renderAction = (action: HeaderAction, index?: number): ReactElement => {
	if (action.type === 'custom') {
		return <Fragment key={index}>{action.element}</Fragment>;
	}
	if (action.type === 'menu' || action.androidElement) {
		return <Fragment key={index}>{action.androidElement}</Fragment>;
	}
	return (
		<HeaderButton.Item
			key={index}
			title={action.label}
			iconName={action.iconName}
			onPress={action.onPress}
			disabled={action.disabled}
			accessibilityLabel={action.accessibilityLabel ?? action.label}
			testID={action.testID}
			badge={action.androidBadge}
			color={typeof action.tintColor === 'string' ? action.tintColor : undefined}
		/>
	);
};

const renderItems = (actions: HeaderAction[], left: boolean) => (
	<HeaderButton.Container left={left}>{actions.map(renderAction)}</HeaderButton.Container>
);

const nativeItems = (actions?: HeaderAction[]) => (Platform.OS === 'ios' && actions ? () => actions.map(nativeItem) : undefined);

const fallbackItems = (actions: HeaderAction[] | undefined, left: boolean) =>
	actions ? () => (actions.length ? renderItems(actions, left) : null) : undefined;

export const headerItems = (sides: { left?: HeaderAction[]; right?: HeaderAction[] }): NativeStackNavigationOptions => {
	const options: NativeStackNavigationOptions = {};
	if ('left' in sides) {
		const { left } = sides;
		options.headerLeft = fallbackItems(left, true);
		options.headerBackVisible = left === undefined;
		options.unstable_headerLeftItems = nativeItems(left);
	}
	if ('right' in sides) {
		const { right } = sides;
		options.headerRight = fallbackItems(right, false);
		options.unstable_headerRightItems = nativeItems(right);
	}
	return options;
};
