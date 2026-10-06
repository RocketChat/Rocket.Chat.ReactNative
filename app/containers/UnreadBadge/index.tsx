import { memo } from 'react';
import { type StyleProp, StyleSheet, Text, useWindowDimensions, View, type ViewStyle } from 'react-native';

import sharedStyles from '~/views/Styles';
import { formatUnreadCount } from '~/lib/methods/helpers/formatUnreadCount';
import { getUnreadStyle } from './getUnreadStyle';
import { useTheme } from '~/theme';

const styles = StyleSheet.create({
	unreadNumberContainerNormal: {
		paddingHorizontal: 4,
		alignItems: 'center',
		justifyContent: 'center'
	},
	unreadNumberContainerSmall: {
		alignItems: 'center',
		justifyContent: 'center'
	},
	unreadText: {
		fontSize: 12,
		lineHeight: 18,
		...sharedStyles.textBold
	},
	textSmall: {
		fontSize: 10,
		...sharedStyles.textSemibold
	}
});

export interface IUnreadBadge {
	unread?: number;
	userMentions?: number;
	groupMentions?: number;
	style?: StyleProp<ViewStyle>;
	tunread?: any[];
	tunreadUser?: any[];
	tunreadGroup?: any[];
	small?: boolean;
	hideUnreadStatus?: boolean;
	hideMentionStatus?: boolean;
}

function getTestId(userMentions: number | undefined, groupMentions: number | undefined, unread: string) {
	if (userMentions) {
		return `mention-badge-${unread}`;
	}
	if (groupMentions) {
		return `group-mention-badge-${unread}`;
	}
	if (unread) {
		return `unread-badge-${unread}`;
	}
	return '';
}

const UnreadBadge = memo(
	({
		unread,
		userMentions,
		groupMentions,
		style,
		tunread,
		tunreadUser,
		tunreadGroup,
		small,
		hideMentionStatus,
		hideUnreadStatus
	}: IUnreadBadge) => {
		const { theme } = useTheme();
		const { fontScale } = useWindowDimensions();

		if ((!unread || unread <= 0) && !tunread?.length) {
			return null;
		}

		if (hideUnreadStatus && hideMentionStatus) {
			return null;
		}

		// Return null when hideUnreadStatus is true and isn't a direct mention
		if (hideUnreadStatus && !((userMentions && userMentions > 0) || tunreadUser?.length)) {
			return null;
		}

		const { backgroundColor, color } = getUnreadStyle({
			theme,
			unread,
			userMentions,
			groupMentions,
			tunread,
			tunreadUser,
			tunreadGroup
		});

		if (!backgroundColor) {
			return null;
		}
		const text = formatUnreadCount(unread || tunread?.length || 0, small ? 99 : 999);

		let minWidth = 18;
		if (small) {
			minWidth = 11 + text.length * 5;
		}
		const borderRadius = 10 * fontScale;
		const testId = getTestId(userMentions, groupMentions, text);

		return (
			<View
				style={[
					small ? styles.unreadNumberContainerSmall : styles.unreadNumberContainerNormal,
					{ backgroundColor, minWidth: minWidth * fontScale, borderRadius },
					style
				]}
				testID={testId}>
				<Text style={[styles.unreadText, small && styles.textSmall, { color }]} numberOfLines={1}>
					{text}
				</Text>
			</View>
		);
	}
);

export default UnreadBadge;
