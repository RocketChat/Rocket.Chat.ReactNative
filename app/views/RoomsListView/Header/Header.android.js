import React from 'react';
import {
	Text, View, TouchableOpacity, Image, StyleSheet
} from 'react-native';
import PropTypes from 'prop-types';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center'
	},
	button: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	server: {
		fontSize: 20,
		color: '#FFF'
	},
	disclosure: {
		marginLeft: 9,
		marginTop: 1,
		width: 10,
		height: 5
	},
	upsideDown: {
		transform: [{ scaleY: -1 }]
	}
});

const Header = ({ onPress, serverName, showServerDropdown }) => (
	<View style={styles.container}>
		<TouchableOpacity onPress={onPress} testID='rooms-list-header-server-dropdown-button'>
			<View style={styles.button}>
				<Text style={styles.server}>{serverName}</Text>
				<Image style={[styles.disclosure, showServerDropdown && styles.upsideDown]} source={{ uri: 'disclosure_indicator_server' }} />
			</View>
		</TouchableOpacity>
	</View>
);

Header.propTypes = {
	onPress: PropTypes.func.isRequired,
	serverName: PropTypes.string,
	showServerDropdown: PropTypes.bool.isRequired
};

Header.defaultProps = {
	serverName: 'Rocket.Chat'
};

export default Header;
