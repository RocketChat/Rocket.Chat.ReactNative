import React from 'react';
import {
	Text, View, TouchableOpacity, Image, StyleSheet
} from 'react-native';
import PropTypes from 'prop-types';

import I18n from '../../../i18n';
import sharedStyles from '../../Styles';
import { COLOR_PRIMARY } from '../../../constants/colors';

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
		...sharedStyles.textColorTitle,
		...sharedStyles.textRegular
	},
	server: {
		fontSize: 12,
		color: COLOR_PRIMARY,
		...sharedStyles.textRegular
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

const HeaderTitle = React.memo(({ connecting, isFetching }) => {
	if (connecting) {
		return <Text style={styles.title}>{I18n.t('Connecting')}</Text>;
	}
	if (isFetching) {
		return <Text style={styles.title}>{I18n.t('Updating')}</Text>;
	}
	return <Text style={styles.title}>{I18n.t('Messages')}</Text>;
});

const Header = React.memo(({
	connecting, isFetching, serverName, showServerDropdown, onPress
}) => (
	<View style={styles.container}>
		<TouchableOpacity
			onPress={onPress}
			testID='rooms-list-header-server-dropdown-button'
			style={styles.container}
		>
			<HeaderTitle connecting={connecting} isFetching={isFetching} />
			<View style={styles.button}>
				<Text style={styles.server}>{serverName}</Text>
				<Image style={[styles.disclosure, showServerDropdown && styles.upsideDown]} source={{ uri: 'disclosure_indicator_server' }} />
			</View>
		</TouchableOpacity>
	</View>
));

Header.propTypes = {
	connecting: PropTypes.bool,
	isFetching: PropTypes.bool,
	serverName: PropTypes.string,
	showServerDropdown: PropTypes.bool.isRequired,
	onPress: PropTypes.func.isRequired
};

Header.defaultProps = {
	serverName: 'Rocket.Chat'
};

HeaderTitle.propTypes = {
	connecting: PropTypes.bool,
	isFetching: PropTypes.bool
};

export default Header;
