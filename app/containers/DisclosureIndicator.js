import React from 'react';
import { View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import { themes } from '../constants/colors';
import { CustomIcon } from '../lib/Icons';

const styles = StyleSheet.create({
	disclosureContainer: {
		marginLeft: 6,
		marginRight: 9,
		alignItems: 'center',
		justifyContent: 'center'
	}
});

export const DisclosureImage = React.memo(({ theme }) => (
	<CustomIcon
		name='chevron-right'
		color={themes[theme].auxiliaryText}
		size={20}
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
