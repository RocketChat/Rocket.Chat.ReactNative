import { StackActions, useNavigation } from '@react-navigation/native';
import type { StyleProp, ViewStyle } from 'react-native';
import { memo } from 'react';

import I18n from '../../../../i18n';
import { isIOS } from '../../../../lib/methods/helpers/deviceInfo';
import Container from './HeaderButtonContainer';
import Item, { type IHeaderButtonItem } from './HeaderButtonItem';
import { useTheme } from '../../../../theme';

interface IHeaderButtonCommon extends IHeaderButtonItem {
	navigation?: any; // TODO: Evaluate proper type
	style?: StyleProp<ViewStyle>;
}

// Left
export const Drawer = ({
	navigation,
	testID,
	style = {},
	onPress = () => navigation?.toggleDrawer(),
	...props
}: IHeaderButtonCommon) => {
	const { colors } = useTheme();
	return (
		<Container style={style} left>
			<Item
				accessibilityLabel={I18n.t('Menu')}
				iconName='hamburguer'
				onPress={onPress}
				testID={testID}
				color={colors.fontDefault}
				{...props}
			/>
		</Container>
	);
};

export const CloseModal = memo(function CloseModal({ testID, onPress, ...props }: IHeaderButtonCommon) {
	const { dispatch } = useNavigation();
	return (
		<Container left>
			<Item
				accessibilityLabel={I18n.t('Close')}
				iconName='close'
				onPress={arg => {
					if (onPress) return onPress(arg);
					dispatch(StackActions.pop());
				}}
				testID={testID}
				{...props}
			/>
		</Container>
	);
});

export const CancelModal = memo(function CancelModal({ onPress, testID, ...props }: IHeaderButtonCommon) {
	return (
		<Container left>
			{isIOS ? (
				<Item title={I18n.t('Cancel')} onPress={onPress} testID={testID} {...props} />
			) : (
				<Item iconName='close' onPress={onPress} testID={testID} {...props} />
			)}
		</Container>
	);
});

// Right
export const More = memo(function More({ onPress, testID, ...props }: IHeaderButtonCommon) {
	return (
		<Container>
			<Item iconName='kebab' onPress={onPress} testID={testID} {...props} />
		</Container>
	);
});

export const Download = memo(function Download({ onPress, testID, ...props }: IHeaderButtonCommon) {
	return (
		<Container>
			<Item iconName='download' onPress={onPress} testID={testID} {...props} />
		</Container>
	);
});

export const Preferences = memo(function Preferences({ onPress, testID, ...props }: IHeaderButtonCommon) {
	return (
		<Container>
			<Item iconName='settings' onPress={onPress} testID={testID} {...props} />
		</Container>
	);
});

export const Legal = memo(function Legal({
	navigation,
	testID,
	onPress = () => navigation?.navigate('LegalView'),
	...props
}: IHeaderButtonCommon) {
	return <More accessibilityLabel={I18n.t('More')} onPress={onPress} testID={testID} {...props} />;
});
