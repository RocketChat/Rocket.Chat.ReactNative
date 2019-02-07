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

const HeaderTitle = ({ isFetching }) => {
	if (isFetching) {
		return <Text style={styles.title}>{I18n.t('Updating')}</Text>;
	}
	return <Text style={styles.title}>{I18n.t('Messages')}</Text>;
};

const Header = ({
	isFetching, serverName, showServerDropdown, onPress
}) => (
	<View style={styles.container}>
		<TouchableOpacity
			onPress={onPress}
			testID='rooms-list-header-server-dropdown-button'
			style={styles.container}
		>
			<HeaderTitle isFetching={isFetching} />
			<View style={styles.button}>
				<Text style={styles.server}>{serverName}</Text>
				<Image style={[styles.disclosure, showServerDropdown && styles.upsideDown]} source={{ uri: 'disclosure_indicator_server' }} />
			</View>
		</TouchableOpacity>
	</View>
);

Header.propTypes = {
	isFetching: PropTypes.bool,
	serverName: PropTypes.string,
	showServerDropdown: PropTypes.bool.isRequired,
	onPress: PropTypes.func.isRequired
};

Header.defaultProps = {
	serverName: 'Rocket.Chat'
};

HeaderTitle.propTypes = {
	isFetching: PropTypes.bool
};

export default Header;
