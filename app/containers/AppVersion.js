import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import PropTypes from 'prop-types';

import { themes } from '../constants/colors';
import sharedStyles from '../views/Styles';
import { getReadableVersion } from '../utils/deviceInfo';

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		justifyContent: 'flex-end',
		backgroundColor: '#ccc'
	},
	text: {
		...sharedStyles.textRegular,
		fontSize: 13
	},
	bold: {
		...sharedStyles.textSemibold
	}
});

const Check = React.memo(({ theme }) => (
	<View style={styles.container}>
		<Text style={[styles.text, { color: themes[theme].auxiliaryText }]}>App Version: <Text style={styles.bold}>{getReadableVersion}</Text></Text>
	</View>
));

Check.propTypes = {
	theme: PropTypes.string
};

export default Check;
