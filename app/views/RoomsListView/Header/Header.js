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

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center'
	},
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		marginRight: 64
	},
	server: {
		fontSize: 20,
		...sharedStyles.textRegular
	},
	serverSmall: {
		fontSize: 16
	},
	updating: {
		fontSize: 14,
		...sharedStyles.textRegular
	},
	upsideDown: {
		transform: [{ scaleY: -1 }]
	}
});

const Header = React.memo(({
	connecting, isFetching, serverName, showServerDropdown, showSearchHeader, theme, onSearchChangeText, onPress
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
	return (
		<View style={styles.container}>
			<TouchableOpacity
				onPress={onPress}
				testID='rooms-list-header-server-dropdown-button'
				disabled={connecting || isFetching}
			>
				{connecting ? <Text style={[styles.updating, titleColorStyle]}>{I18n.t('Connecting')}</Text> : null}
				{isFetching ? <Text style={[styles.updating, titleColorStyle]}>{I18n.t('Updating')}</Text> : null}
				<View style={styles.button}>
					<Text style={[styles.server, isFetching && styles.serverSmall, titleColorStyle]} numberOfLines={1}>{serverName}</Text>
					<CustomIcon
						name='chevron-down'
						color={themes[theme].headerTintColor}
						style={[showServerDropdown && styles.upsideDown]}
						size={18}
					/>
				</View>
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
	isFetching: PropTypes.bool,
	serverName: PropTypes.string,
	theme: PropTypes.string
};

Header.defaultProps = {
	serverName: 'Rocket.Chat'
};

export default Header;
