import React from 'react';
import {
	View, StyleSheet, Text, TextInput
} from 'react-native';
import PropTypes from 'prop-types';

import I18n from '../../../i18n';
import { COLOR_WHITE, HEADER_TITLE } from '../../../constants/colors';
import sharedStyles from '../../Styles';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center'
	},
	search: {
		fontSize: 20,
		color: COLOR_WHITE,
		...sharedStyles.textRegular,
		marginHorizontal: 14
	},
	title: {
		fontSize: 20,
		...sharedStyles.textBold,
		color: HEADER_TITLE,
		marginHorizontal: 16
	}
});

const Header = React.memo(({ searching, onChangeSearchText }) => {
	if (searching) {
		return (
			<View style={styles.container}>
				<TextInput
					style={styles.search}
					placeholder={I18n.t('Search')}
					placeholderTextColor='rgba(255, 255, 255, 0.5)'
					onChangeText={onChangeSearchText}
					autoFocus
				/>
			</View>
		);
	}
	return <Text style={styles.title}>{I18n.t('Send_to')}</Text>;
});

Header.propTypes = {
	searching: PropTypes.bool,
	onChangeSearchText: PropTypes.func
};

export default Header;
