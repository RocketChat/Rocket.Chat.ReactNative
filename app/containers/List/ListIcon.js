import React from 'react';
import { View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import { themes } from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';
import { withTheme } from '../../theme';
import { ICON_SIZE } from './constants';

const styles = StyleSheet.create({
	icon: {
		alignItems: 'center',
		justifyContent: 'center'
	}
});

const ListIcon = React.memo(({
	theme,
	name,
	color,
	style
}) => (
	<View style={[styles.icon, style]}>
		<CustomIcon
			name={name}
			color={color ?? themes[theme].auxiliaryText}
			size={ICON_SIZE}
		/>
	</View>
));

ListIcon.propTypes = {
	theme: PropTypes.string,
	name: PropTypes.string,
	color: PropTypes.string,
	style: PropTypes.object
};

ListIcon.displayName = 'List.Icon';

export default withTheme(ListIcon);
