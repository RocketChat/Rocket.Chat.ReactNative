import { memo } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';

import { formatUnreadCount } from '~/lib/methods/helpers/formatUnreadCount';
import { getUnreadStyle } from './getUnreadStyle';
import { useTheme } from '~/theme';
import CountBadge from './CountBadge';

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

		return (
			<CountBadge
				text={text}
				backgroundColor={backgroundColor}
				color={color}
				small={small}
				style={style}
				testID={getTestId(userMentions, groupMentions, text)}
			/>
		);
	}
);

export default UnreadBadge;
