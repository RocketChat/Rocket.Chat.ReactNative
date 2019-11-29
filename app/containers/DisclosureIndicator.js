import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import { themes } from '../constants/colors';

const styles = StyleSheet.create({
	disclosureContainer: {
		marginLeft: 6,
		marginRight: 9,
		alignItems: 'center',
		justifyContent: 'center'
	},
	disclosureIndicator: {
		width: 20,
		height: 20
	}
});

export const DisclosureImage = React.memo(({ theme }) => (
	<Image
		source={{ uri: 'disclosure_indicator' }}
		style={[styles.disclosureIndicator, { tintColor: themes[theme].auxiliaryTintColor }]}
	/>
));
DisclosureImage.propTypes = {
	theme: PropTypes.string
};

const DisclosureIndicator = React.memo(({ theme }) => (
	<View style={styles.disclosureContainer}>
		<DisclosureImage theme={theme} />
	</View>
));
DisclosureIndicator.propTypes = {
	theme: PropTypes.string
};

export default DisclosureIndicator;
