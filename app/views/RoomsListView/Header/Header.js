import React from 'react';
import {
	Text, View, TouchableOpacity, StyleSheet
} from 'react-native';
import PropTypes from 'prop-types';

import TextInput from '../../../presentation/TextInput';
import I18n from '../../../i18n';
import sharedStyles from '../../Styles';
import { themes } from '../../../constants/colors';
import { CustomIcon } from '../../../lib/Icons';
import { isTablet } from '../../../utils/deviceInfo';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		marginLeft: isTablet ? 10 : 0
	},
	button: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	server: {
		fontSize: 16,
		...sharedStyles.textSemibold
	},
	updating: {
		fontSize: 12,
		...sharedStyles.textRegular
	},
	upsideDown: {
		transform: [{ scaleY: -1 }]
	}
});

const Header = React.memo(({
	connecting, connected, isFetching, serverName, server, showServerDropdown, showSearchHeader, theme, onSearchChangeText, onPress
}) => {
	const titleColorStyle = { color: themes[theme].headerTitleColor };
	const isLight = theme === 'light';
	if (showSearchHeader) {
		return (
			<View style={styles.container}>
				<TextInput
					autoFocus
					style={[styles.server, isLight && titleColorStyle]}
					placeholder='Search'
					onChangeText={onSearchChangeText}
					theme={theme}
				/>
			</View>
		);
	}
	let subtitle;
	if (connecting) {
		subtitle = I18n.t('Connecting');
	} else if (isFetching) {
		subtitle = I18n.t('Updating');
	} else if (!connected) {
		subtitle = I18n.t('Waiting_for_network');
	} else {
		subtitle = server?.replace(/(^\w+:|^)\/\//, '');
	}
	return (
		<View style={styles.container}>
			<TouchableOpacity
				onPress={onPress}
				testID='rooms-list-header-server-dropdown-button'
			>
				<View style={styles.button}>
					<Text style={[styles.server, isFetching && styles.serverSmall, titleColorStyle]} numberOfLines={1}>{serverName}</Text>
					<CustomIcon
						name='chevron-down'
						color={themes[theme].headerTintColor}
						style={[showServerDropdown && styles.upsideDown]}
						size={18}
					/>
				</View>
				{subtitle ? <Text style={[styles.updating, { color: themes[theme].auxiliaryText }]}>{subtitle}</Text> : null}
			</TouchableOpacity>
		</View>
	);
});

Header.propTypes = {
	showServerDropdown: PropTypes.bool.isRequired,
	showSearchHeader: PropTypes.bool.isRequired,
	onPress: PropTypes.func.isRequired,
	onSearchChangeText: PropTypes.func.isRequired,
	connecting: PropTypes.bool,
	connected: PropTypes.bool,
	isFetching: PropTypes.bool,
	serverName: PropTypes.string,
	server: PropTypes.string,
	theme: PropTypes.string
};

Header.defaultProps = {
	serverName: 'Rocket.Chat'
};

export default Header;
