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
import { isTablet, isIOS } from '../../../utils/deviceInfo';
import { useOrientation } from '../../../dimensions';

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
	title: {
		...sharedStyles.textSemibold
	},
	subtitle: {
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
	const { isLandscape } = useOrientation();
	const scale = isIOS && isLandscape && !isTablet ? 0.8 : 1;
	const titleFontSize = 16 * scale;
	const subTitleFontSize = 14 * scale;

	if (showSearchHeader) {
		return (
			<View style={styles.container}>
				<TextInput
					autoFocus
					style={[styles.title, isLight && titleColorStyle, { fontSize: titleFontSize }]}
					placeholder='Search'
					onChangeText={onSearchChangeText}
					theme={theme}
					testID='rooms-list-view-search-input'
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
					<Text style={[styles.title, isFetching && styles.serverSmall, titleColorStyle, { fontSize: titleFontSize }]} numberOfLines={1}>{serverName}</Text>
					<CustomIcon
						name='chevron-down'
						color={themes[theme].headerTintColor}
						style={[showServerDropdown && styles.upsideDown]}
						size={18}
					/>
				</View>
				{subtitle ? <Text style={[styles.subtitle, { color: themes[theme].auxiliaryText, fontSize: subTitleFontSize }]} numberOfLines={1}>{subtitle}</Text> : null}
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
