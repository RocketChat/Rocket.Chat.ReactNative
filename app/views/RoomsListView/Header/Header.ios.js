import React from 'react';
import {
	Text, View, TouchableOpacity, Image, StyleSheet
} from 'react-native';
import PropTypes from 'prop-types';

import I18n from '../../../i18n';
import sharedStyles from '../../Styles';
import { themes } from '../../../constants/colors';

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
		...sharedStyles.textRegular
	},
	server: {
		fontSize: 12,
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

const HeaderTitle = React.memo(({ connecting, isFetching, theme }) => {
	let title = I18n.t('Messages');
	if (connecting) {
		title = I18n.t('Connecting');
	}
	if (isFetching) {
		title = I18n.t('Updating');
	}
	return <Text style={[styles.title, { color: themes[theme].headerTitleColor }]}>{title}</Text>;
});

const Header = React.memo(({
	connecting, isFetching, serverName, showServerDropdown, onPress, theme
}) => (
	<View style={styles.container}>
		<TouchableOpacity
			onPress={onPress}
			testID='rooms-list-header-server-dropdown-button'
			style={styles.container}
			disabled={connecting || isFetching}
		>
			<HeaderTitle connecting={connecting} isFetching={isFetching} theme={theme} />
			<View style={styles.button}>
				<Text style={[styles.server, { color: themes[theme].headerTintColor }]}>{serverName}</Text>
				<Image style={[styles.disclosure, showServerDropdown && styles.upsideDown]} source={{ uri: 'disclosure_indicator_server' }} />
			</View>
		</TouchableOpacity>
	</View>
));

Header.propTypes = {
	connecting: PropTypes.bool,
	isFetching: PropTypes.bool,
	serverName: PropTypes.string,
	theme: PropTypes.string,
	showServerDropdown: PropTypes.bool.isRequired,
	onPress: PropTypes.func.isRequired
};

Header.defaultProps = {
	serverName: 'Rocket.Chat'
};

HeaderTitle.propTypes = {
	connecting: PropTypes.bool,
	isFetching: PropTypes.bool,
	theme: PropTypes.string
};

export default Header;
