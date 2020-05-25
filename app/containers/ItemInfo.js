import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import sharedStyles from '../views/Styles';
import { themes } from '../constants/colors';

const styles = StyleSheet.create({
	infoContainer: {
		padding: 15
	},
	infoText: {
		fontSize: 14,
		...sharedStyles.textRegular
	}
});

const ItemInfo = React.memo(({ info, theme }) => (
	<View style={[styles.infoContainer, { backgroundColor: themes[theme].auxiliaryBackground }]}>
		<Text style={[styles.infoText, { color: themes[theme].infoText }]}>{info}</Text>
	</View>
));

ItemInfo.propTypes = {
	info: PropTypes.string,
	theme: PropTypes.string
};

export default ItemInfo;
