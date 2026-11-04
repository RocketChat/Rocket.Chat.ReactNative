import { type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import CountBadge from '~/containers/UnreadBadge/CountBadge';
import { useTheme } from '~/theme';
import { formatUnreadCount } from '~/lib/methods/helpers/formatUnreadCount';

const styles = StyleSheet.create({
	badgeContainer: {
		padding: 2,
		position: 'absolute',
		right: -4,
		top: -4,
		alignItems: 'center',
		justifyContent: 'center'
	}
});

export const BadgeWarn = ({ color }: { color: string }): ReactElement => (
	<View style={[styles.badgeContainer, { width: 10, height: 10, borderRadius: 5, backgroundColor: color }]} />
);

export const BadgeCount = ({ value, color }: { value: number; color: string }): ReactElement => {
	const { colors } = useTheme();
	return (
		<CountBadge
			text={formatUnreadCount(value)}
			backgroundColor={color}
			color={colors.fontWhite}
			small
			style={styles.badgeContainer}
		/>
	);
};
