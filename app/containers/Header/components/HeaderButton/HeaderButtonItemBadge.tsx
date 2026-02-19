import { StyleSheet, View } from 'react-native';
import type { ReactElement } from 'react';

import UnreadBadge from '../../../UnreadBadge';

const styles = StyleSheet.create({
	badgeContainer: {
		padding: 2,
		position: 'absolute',
		right: -4,
		top: -4,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center'
	}
});

export const BadgeUnread = ({ ...props }): ReactElement => <UnreadBadge {...props} style={styles.badgeContainer} small />;

export const BadgeWarn = ({ color }: { color: string }): ReactElement => (
	<View style={[styles.badgeContainer, { width: 10, height: 10, backgroundColor: color }]} />
);
