import React from 'react';
import { View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import { themes } from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';
import { withTheme } from '../../theme';

const styles = StyleSheet.create({
	icon: {
		alignItems: 'center',
		justifyContent: 'center'
	}
});

const ListIcon = React.memo(({ theme, name, color }) => (
	<View style={styles.icon}>
		<CustomIcon
			name={name}
			color={color ?? themes[theme].auxiliaryText}
			size={20}
		/>
	</View>
));

ListIcon.propTypes = {
	theme: PropTypes.string,
	name: PropTypes.string,
	color: PropTypes.string
};

ListIcon.displayName = 'List.Icon';

export default withTheme(ListIcon);
