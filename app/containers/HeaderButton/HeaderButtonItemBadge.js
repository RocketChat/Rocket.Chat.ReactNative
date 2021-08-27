import React from 'react';
import { StyleSheet } from 'react-native';

import UnreadBadge from '../../presentation/UnreadBadge';

const styles = StyleSheet.create({
	badgeContainer: {
		padding: 2,
		position: 'absolute',
		right: -3,
		top: -3,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center'
	}
});

export const Badge = ({ ...props }) => (
	<UnreadBadge
		{...props}
		style={styles.badgeContainer}
		small
	/>
);

export default Badge;
