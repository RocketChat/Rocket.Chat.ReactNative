import React from 'react';
import { StyleSheet, View } from 'react-native';

import { STATUS_COLORS } from '../../lib/constants';
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

export const BadgeWarn = (): React.ReactElement => (
	<View style={[styles.badgeContainer, { width: 10, height: 10, backgroundColor: STATUS_COLORS.disabled }]} />
);
