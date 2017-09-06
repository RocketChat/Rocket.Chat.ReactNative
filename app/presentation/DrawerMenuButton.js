import React from 'react';
import PropTypes from 'prop-types';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const DrawerMenuButton = ({ navigation }) => (
	<TouchableOpacity
		onPress={() => navigation.navigate('DrawerOpen')}
	>
		<Icon name='menu' style={{ color: '#ffffff' }} />
	</TouchableOpacity>
);

DrawerMenuButton.propTypes = {
	navigation: PropTypes.object.isRequired
};

export default DrawerMenuButton;
