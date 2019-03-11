import React from 'react';
import PropTypes from 'prop-types';
import { Text } from 'react-native';
import HeaderButtons, { HeaderButton, Item } from 'react-navigation-header-buttons';

import { CustomIcon } from '../lib/Icons';
import { isIOS } from '../utils/deviceInfo';

const color = isIOS ? '#1D74F5' : '#FFF';

const CustomHeaderButton = React.memo(props => (
	<HeaderButton {...props} IconComponent={CustomIcon} iconSize={23} color={color} />
));

export const CustomHeaderButtons = React.memo(props => (
	<HeaderButtons
		HeaderButtonComponent={CustomHeaderButton}
		{...props}
	/>
));

export const DrawerButton = React.memo(({ navigation, testID }) => (
	<CustomHeaderButtons left>
		<Item title='drawer' iconName='customize' onPress={navigation.toggleDrawer} testID={testID} />
	</CustomHeaderButtons>
));

export const CloseModalButton = React.memo(({ navigation, testID }) => (
	<CustomHeaderButtons left>
		<Item title='close' iconName='cross' onPress={() => navigation.pop()} testID={testID} />
	</CustomHeaderButtons>
));

export const MoreButton = React.memo(({ onPress, testID }) => (
	<CustomHeaderButtons>
		<Item title='more' iconName='menu' onPress={onPress} testID={testID} />
	</CustomHeaderButtons>
));

export const LegalButton = React.memo(({ navigation, testID }) => (
	<MoreButton onPress={() => navigation.navigate('LegalView')} testID={testID} />
));

DrawerButton.propTypes = {
	navigation: PropTypes.object.isRequired,
	testID: PropTypes.string.isRequired
};
CloseModalButton.propTypes = {
	navigation: PropTypes.object.isRequired,
	testID: PropTypes.string.isRequired
};
MoreButton.propTypes = {
	onPress: PropTypes.func.isRequired,
	testID: PropTypes.string.isRequired
};
LegalButton.propTypes = {
	navigation: PropTypes.object.isRequired,
	testID: PropTypes.string.isRequired
};

export { Item };

export default () => <Text>a</Text>;
