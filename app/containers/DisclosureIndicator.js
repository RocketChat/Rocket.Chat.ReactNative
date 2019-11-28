import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

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

export const DisclosureImage = React.memo(({ color }) => (
	<Image
		source={{ uri: 'disclosure_indicator' }}
		style={[styles.disclosureIndicator, { tintColor: color }]}
	/>
));
DisclosureImage.propTypes = {
	color: PropTypes.string
};

const DisclosureIndicator = React.memo(({ color }) => (
	<View style={styles.disclosureContainer}>
		<DisclosureImage color={color} />
	</View>
));
DisclosureIndicator.propTypes = {
	color: PropTypes.string
};

export default DisclosureIndicator;
