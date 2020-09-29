import React from 'react';
import { View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import { themes } from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';
import { withTheme } from '../../theme';

const styles = StyleSheet.create({
	disclosureContainer: {
		// marginLeft: 0,
		// marginRight: 0,
		alignItems: 'center',
		justifyContent: 'center'
	}
});

const ListIcon = React.memo(({ theme, name }) => (
	<View style={styles.disclosureContainer}>
		<CustomIcon
			name={name}
			color={themes[theme].auxiliaryText}
			size={20}
		/>
	</View>
));
ListIcon.propTypes = {
	theme: PropTypes.string,
	name: PropTypes.string
};

export default withTheme(ListIcon);
