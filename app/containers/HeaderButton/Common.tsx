import React from 'react';

import { isIOS } from '../../utils/deviceInfo';
import I18n from '../../i18n';
import Container from './HeaderButtonContainer';
import Item from './HeaderButtonItem';

interface IHeaderButtonCommon {
	navigation?: any; // TODO: Evaluate proper type
	onPress?: () => void;
	testID?: string;
}

// Left
export const Drawer = React.memo(
	({ navigation, testID, onPress = navigation?.toggleDrawer(), ...props }: IHeaderButtonCommon) => (
		<Container left>
			<Item iconName='hamburguer' onPress={onPress} testID={testID} {...props} />
		</Container>
	)
);

export const CloseModal = React.memo(
	({ navigation, testID, onPress = () => navigation?.pop(), ...props }: IHeaderButtonCommon) => (
		<Container left>
			<Item iconName='close' onPress={onPress} testID={testID} {...props} />
		</Container>
	)
);

export const CancelModal = React.memo(({ onPress, testID }: Partial<IHeaderButtonCommon>) => (
	<Container left>
		{isIOS ? (
			<Item title={I18n.t('Cancel')} onPress={onPress} testID={testID} />
		) : (
			<Item iconName='close' onPress={onPress} testID={testID} />
		)}
	</Container>
));

// Right
export const More = React.memo(({ onPress, testID }: Partial<IHeaderButtonCommon>) => (
	<Container>
		<Item iconName='kebab' onPress={onPress} testID={testID} />
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

export const Legal = React.memo(({ navigation, testID, onPress = navigation?.navigate('LegalView') }: IHeaderButtonCommon) => (
	<More onPress={onPress} testID={testID} />
));
