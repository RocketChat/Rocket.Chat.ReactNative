import React from 'react';
import {
	Text, View, StyleSheet
} from 'react-native';
import PropTypes from 'prop-types';
import { TextInput } from 'react-native-gesture-handler';

import I18n from '../../../i18n';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center'
	},
	server: {
		fontSize: 20,
		color: '#FFF'
	}
});

const Header = ({
	serverName, setSearchInputRef, showSearchHeader, onSearchChangeText, isFetching, width
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
		<View style={[styles.container, { width: width - 150 }]}>
			<Text style={styles.updating}>{isFetching ? I18n.t('Updating') : serverName}</Text>
		</View>
	);
};

Header.propTypes = {
	showSearchHeader: PropTypes.bool.isRequired,
	onSearchChangeText: PropTypes.func.isRequired,
	setSearchInputRef: PropTypes.func.isRequired,
	isFetching: PropTypes.bool,
	serverName: PropTypes.string,
	width: PropTypes.number
};

Header.defaultProps = {
	serverName: 'Rocket.Chat'
};

export default Header;
