import React from 'react';
import { StyleSheet, View } from 'react-native';

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

export const BadgeUnread = ({ ...props }): React.ReactElement => <UnreadBadge {...props} style={styles.badgeContainer} small />;

export const BadgeWarn = ({ color }: { color: string }): React.ReactElement => (
	<View style={[styles.badgeContainer, { width: 10, height: 10, backgroundColor: color }]} />
);
