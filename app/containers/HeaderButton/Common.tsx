import React from 'react';
import { StackActions, useNavigation } from '@react-navigation/native';

import I18n from '../../i18n';
import { isIOS } from '../../lib/methods/helpers';
import Container from './HeaderButtonContainer';
import Item, { IHeaderButtonItem } from './HeaderButtonItem';
import { useTheme } from '../../theme';

interface IHeaderButtonCommon extends IHeaderButtonItem {
	navigation?: any; // TODO: Evaluate proper type
}

// Left
export const Drawer = ({ navigation, testID, onPress = () => navigation?.toggleDrawer(), ...props }: IHeaderButtonCommon) => {
	const { colors } = useTheme();
	return (
		<Container left>
			<Item iconName='hamburguer' onPress={onPress} testID={testID} color={colors.fontDefault} {...props} />
		</Container>
	);
};

export const CloseModal = React.memo(({ testID, onPress, ...props }: IHeaderButtonCommon) => {
	const { dispatch } = useNavigation();
	return (
		<Container left>
			<Item
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

export const CancelModal = React.memo(({ onPress, testID, ...props }: IHeaderButtonCommon) => (
	<Container left>
		{isIOS ? (
			<Item title={I18n.t('Cancel')} onPress={onPress} testID={testID} {...props} />
		) : (
			<Item iconName='close' onPress={onPress} testID={testID} {...props} />
		)}
	</Container>
));

// Right
export const More = React.memo(({ onPress, testID, ...props }: IHeaderButtonCommon) => (
	<Container>
		<Item iconName='kebab' onPress={onPress} testID={testID} {...props} />
	</Container>
));

export const Download = React.memo(({ onPress, testID, ...props }: IHeaderButtonCommon) => (
	<Container>
		<Item iconName='download' onPress={onPress} testID={testID} {...props} />
	</Container>
));

export const Preferences = React.memo(({ onPress, testID, ...props }: IHeaderButtonCommon) => (
	<Container>
		<Item iconName='settings' onPress={onPress} testID={testID} {...props} />
	</Container>
));

export const Legal = React.memo(
	({ navigation, testID, onPress = () => navigation?.navigate('LegalView'), ...props }: IHeaderButtonCommon) => (
		<More onPress={onPress} testID={testID} {...props} />
	)
);
