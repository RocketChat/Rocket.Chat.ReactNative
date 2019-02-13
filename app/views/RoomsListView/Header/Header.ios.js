import React from 'react';
import {
	Text, View, StyleSheet
} from 'react-native';
import PropTypes from 'prop-types';

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

const Header = ({ isFetching }) => (
	<View style={styles.container}>
		<Text style={styles.title}>{isFetching ? I18n.t('Updating') : I18n.t('Messages')}</Text>
	</View>
);

Header.propTypes = {
	isFetching: PropTypes.bool
};

export default Header;
