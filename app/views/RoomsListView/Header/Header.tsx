import React from 'react';
import { StyleSheet, Text, TextInputProps, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';

import TextInput from '../../../containers/TextInput';
import I18n from '../../../i18n';
import sharedStyles from '../../Styles';
import { themes } from '../../../lib/constants';
import { CustomIcon } from '../../../containers/CustomIcon';
import { isIOS, isTablet } from '../../../lib/methods/helpers';
import { useOrientation } from '../../../dimensions';
import { useTheme } from '../../../theme';

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
		flexShrink: 1,
		...sharedStyles.textSemibold
	},
	subtitle: {
		...sharedStyles.textRegular
	},
	upsideDown: {
		transform: [{ scaleY: -1 }]
	}
});

interface IRoomHeader {
	connecting: boolean;
	connected: boolean;
	isFetching: boolean;
	serverName: string;
	server: string;
	showServerDropdown: boolean;
	showSearchHeader: boolean;
	onSearchChangeText: TextInputProps['onChangeText'];
	onPress: TouchableOpacityProps['onPress'];
}

const Header = React.memo(
	({
		connecting,
		connected,
		isFetching,
		serverName = 'Rocket.Chat',
		server,
		showServerDropdown,
		showSearchHeader,
		onSearchChangeText,
		onPress
	}: IRoomHeader) => {
		const { theme } = useTheme();
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
				<TouchableOpacity onPress={onPress} testID='rooms-list-header-server-dropdown-button'>
					<View style={styles.button}>
						<Text style={[styles.title, titleColorStyle, { fontSize: titleFontSize }]} numberOfLines={1}>
							{serverName}
						</Text>
						<CustomIcon
							name='chevron-down'
							color={themes[theme].headerTintColor}
							style={[showServerDropdown && styles.upsideDown]}
							size={18}
						/>
					</View>
					{subtitle ? (
						<Text
							testID='rooms-list-header-server-subtitle'
							style={[styles.subtitle, { color: themes[theme].auxiliaryText, fontSize: subTitleFontSize }]}
							numberOfLines={1}>
							{subtitle}
						</Text>
					) : null}
				</TouchableOpacity>
			</View>
		);
	}
);

export default Header;
