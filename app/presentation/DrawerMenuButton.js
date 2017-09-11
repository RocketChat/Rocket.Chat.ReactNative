import React from 'react';
import PropTypes from 'prop-types';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const DrawerMenuButton = ({ navigation }) => (
	<TouchableOpacity
		onPress={() => navigation.navigate('DrawerOpen')}
	>
		<Icon name='bars' style={{ padding: 10, marginLeft: 10 }} size={20} color='black' />
	</TouchableOpacity>
);

DrawerMenuButton.propTypes = {
	navigation: PropTypes.object.isRequired
};

export default DrawerMenuButton;
