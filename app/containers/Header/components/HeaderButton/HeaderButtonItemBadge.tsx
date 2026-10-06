import { type ReactElement } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import UnreadBadge from '~/containers/UnreadBadge';
import { useTheme } from '~/theme';
import { formatUnreadCount } from '~/lib/methods/helpers/formatUnreadCount';
import sharedStyles from '~/views/Styles';

const styles = StyleSheet.create({
	badgeContainer: {
		padding: 2,
		position: 'absolute',
		right: -4,
		top: -4,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center'
	},
	countText: {
		fontSize: 10,
		...sharedStyles.textSemibold
	}
});

export const BadgeUnread = ({ ...props }): ReactElement => <UnreadBadge {...props} style={styles.badgeContainer} small />;

export const BadgeWarn = ({ color }: { color: string }): ReactElement => (
	<View style={[styles.badgeContainer, { width: 10, height: 10, backgroundColor: color }]} />
);

export const BadgeCount = ({ value, color }: { value: number; color: string }): ReactElement => {
	const { colors } = useTheme();
	const { fontScale } = useWindowDimensions();
	const text = formatUnreadCount(value);
	return (
		<View
			style={[
				styles.badgeContainer,
				{ backgroundColor: color, minWidth: (11 + text.length * 5) * fontScale, borderRadius: 10.5 * fontScale }
			]}>
			<Text style={[styles.countText, { color: colors.fontWhite }]} numberOfLines={1}>
				{text}
			</Text>
		</View>
	);
};
