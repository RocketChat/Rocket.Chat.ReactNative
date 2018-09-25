import React from 'react';
import {
	Text, View, TouchableOpacity, Image, StyleSheet
} from 'react-native';
import PropTypes from 'prop-types';

import I18n from '../../../i18n';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center'
	},
	button: {
		flexDirection: 'row'
	},
	title: {
		fontSize: 14,
		color: '#0C0D0F'
	},
	server: {
		fontSize: 12,
		color: '#1D74F5'
	},
	disclosure: {
		marginLeft: 3,
		marginTop: 1,
		width: 12,
		height: 9
	},
	upsideDown: {
		transform: [{ scaleY: -1 }],
		marginTop: 4
	}
});

const Header = ({ onPress, serverName, showServerDropdown }) => (
	<View style={styles.container}>
		<TouchableOpacity
			onPress={onPress}
			testID='rooms-list-header-server-dropdown-button'
			style={styles.container}
		>
			<Text style={styles.title}>{I18n.t('Messages')}</Text>
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
