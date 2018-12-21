import React from 'react';
import {
	Text, View, StyleSheet
} from 'react-native';

import I18n from '../../../i18n';
import sharedStyles from '../../Styles';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center'
	},
	title: {
		...sharedStyles.textSemibold,
		fontSize: 18,
		color: '#0C0D0F'
	}
});

const Header = () => (
	<View style={styles.container}>
		<Text style={styles.title}>{I18n.t('Messages')}</Text>
	</View>
);

Header.defaultProps = {
	serverName: 'Rocket.Chat'
};

export default Header;
