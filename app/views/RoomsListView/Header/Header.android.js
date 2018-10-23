import React from 'react';
import {
	Text, View, TouchableOpacity, Image, StyleSheet
} from 'react-native';
import PropTypes from 'prop-types';
import { TextInput } from 'react-native-gesture-handler';

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

const Header = ({
	onPress, serverName, showServerDropdown, setSearchInputRef, showSearchHeader, onSearchChangeText
}) => {
	if (showSearchHeader) {
		return (
			<View style={styles.container}>
				<TextInput
					ref={setSearchInputRef}
					style={styles.server}
					placeholder='Search'
					placeholderTextColor='rgba(255, 255, 255, 0.5)'
					onChangeText={onSearchChangeText}
				/>
			</View>
		);
	}
	return (
		<View style={styles.container}>
			<TouchableOpacity onPress={onPress} testID='rooms-list-header-server-dropdown-button'>
				<View style={styles.button}>
					<Text style={styles.server}>{serverName}</Text>
					<Image style={[styles.disclosure, showServerDropdown && styles.upsideDown]} source={{ uri: 'disclosure_indicator_server' }} />
				</View>
			</TouchableOpacity>
		</View>
	);
};

Header.propTypes = {
	showServerDropdown: PropTypes.bool.isRequired,
	showSearchHeader: PropTypes.bool.isRequired,
	onPress: PropTypes.func.isRequired,
	onSearchChangeText: PropTypes.func.isRequired,
	setSearchInputRef: PropTypes.func.isRequired,
	serverName: PropTypes.string
};

Header.defaultProps = {
	serverName: 'Rocket.Chat'
};

export default Header;
