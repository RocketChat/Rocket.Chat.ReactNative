import { forwardRef } from 'react';
import { type KeyboardFocus, withKeyboardFocus } from 'react-native-external-keyboard';

import I18n from '~/i18n';
import Container from './HeaderButtonContainer';
import Item, { type IHeaderButtonItem } from './HeaderButtonItem';
import { useTheme } from '~/theme';

const ItemChildren = withKeyboardFocus(Item);

export const Drawer = forwardRef<KeyboardFocus, IHeaderButtonItem>(({ testID, onPress, ...props }, ref) => {
	const { colors } = useTheme();

	const item = (
		<ItemChildren
			ref={ref}
			autoFocus
			accessibilityLabel={I18n.t('Menu')}
			iconName='hamburguer'
			onPress={onPress}
			testID={testID}
			color={colors.fontDefault}
			{...props}
		/>
	);

	return <Container left>{item}</Container>;
});

Drawer.displayName = 'HeaderButton.Drawer';
