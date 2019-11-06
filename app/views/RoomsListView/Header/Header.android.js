import React from 'react';
import {
	Text, View, TouchableOpacity, Image, StyleSheet
} from 'react-native';
import PropTypes from 'prop-types';
import { TextInput } from 'react-native-gesture-handler';

import I18n from '../../../i18n';
import sharedStyles from '../../Styles';
import { themes } from '../../../constants/colors';

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
		...sharedStyles.textRegular
	},
	serverSmall: {
		fontSize: 16
	},
	updating: {
		fontSize: 14,
		...sharedStyles.textRegular
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

const Header = React.memo(({
	connecting, isFetching, serverName, showServerDropdown, showSearchHeader, theme, onSearchChangeText, onPress
}) => {
	const titleColorStyle = { color: themes[theme].headerTitleColor };
	if (showSearchHeader) {
		return (
			<View style={styles.container}>
				<TextInput
					autoFocus
					style={[styles.server, titleColorStyle]}
					placeholder='Search'
					placeholderTextColor={themes[theme].auxiliaryText}
					onChangeText={onSearchChangeText}
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
					<Text style={[styles.server, isFetching && styles.serverSmall, titleColorStyle]}>{serverName}</Text>
					<Image style={[styles.disclosure, showServerDropdown && styles.upsideDown, titleColorStyle]} source={{ uri: 'disclosure_indicator_server' }} />
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
