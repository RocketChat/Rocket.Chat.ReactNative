import React from 'react';
import PropTypes from 'prop-types';

import Container from './HeaderButtonContainer';
import Item from './HeaderButtonItem';

// Left
export const Drawer = React.memo(({ navigation, testID, ...props }) => (
	<Container left>
		<Item iconName='hamburguer' onPress={() => navigation.toggleDrawer()} testID={testID} {...props} />
	</Container>
));

export const CloseModal = React.memo(({
	navigation, testID, onPress = () => navigation.pop(), ...props
}) => (
	<Container left>
		<Item iconName='close' onPress={onPress} testID={testID} {...props} />
	</Container>
));

export const CancelModal = React.memo(({ onPress, testID }) => (
	<Container left>
		<Item iconName='close' onPress={onPress} testID={testID} />
	</Container>
));

// Right
export const More = React.memo(({ onPress, testID }) => (
	<Container>
		<Item iconName='kebab' onPress={onPress} testID={testID} />
	</Container>
));

export const Download = React.memo(({ onPress, testID, ...props }) => (
	<Container>
		<Item iconName='download' onPress={onPress} testID={testID} {...props} />
	</Container>
));

export const Preferences = React.memo(({ onPress, testID, ...props }) => (
	<Container>
		<Item iconName='settings' onPress={onPress} testID={testID} {...props} />
	</Container>
));

export const Legal = React.memo(({ navigation, testID }) => (
	<More onPress={() => navigation.navigate('LegalView')} testID={testID} />
));

Drawer.propTypes = {
	navigation: PropTypes.object.isRequired,
	testID: PropTypes.string.isRequired
};
CloseModal.propTypes = {
	navigation: PropTypes.object.isRequired,
	testID: PropTypes.string.isRequired,
	onPress: PropTypes.func
};
CancelModal.propTypes = {
	onPress: PropTypes.func.isRequired,
	testID: PropTypes.string.isRequired
};
More.propTypes = {
	onPress: PropTypes.func.isRequired,
	testID: PropTypes.string.isRequired
};
Download.propTypes = {
	onPress: PropTypes.func.isRequired,
	testID: PropTypes.string.isRequired
};
Preferences.propTypes = {
	onPress: PropTypes.func.isRequired,
	testID: PropTypes.string.isRequired
};
Legal.propTypes = {
	navigation: PropTypes.object.isRequired,
	testID: PropTypes.string.isRequired
};
