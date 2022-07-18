import React from 'react';
import { StyleSheet } from 'react-native';

import UnreadBadge from '../UnreadBadge';

const styles = StyleSheet.create({
	badgeContainer: {
		padding: 2,
		position: 'absolute',
		right: 2,
		top: 2,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center'
	}
});

export const Badge = ({ ...props }): React.ReactElement => <UnreadBadge {...props} style={styles.badgeContainer} small />;

export default Badge;
