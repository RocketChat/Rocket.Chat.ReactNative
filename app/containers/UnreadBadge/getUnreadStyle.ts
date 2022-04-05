import { IUnreadBadge } from '.';
import { themes } from '../../constants/colors';

interface IGetUnreadStyle extends Omit<IUnreadBadge, 'small' | 'style'> {
	theme: string;
}

export const getUnreadStyle = ({
	unread,
	userMentions,
	groupMentions,
	theme,
	tunread,
	tunreadUser,
	tunreadGroup
}: IGetUnreadStyle) => {
	if ((!unread || unread <= 0) && !tunread?.length) {
		return {};
	}

	let backgroundColor = themes[theme].unreadColor;
	const color = themes[theme].buttonText;
	if ((userMentions && userMentions > 0) || tunreadUser?.length) {
		backgroundColor = themes[theme].mentionMeColor;
	} else if ((groupMentions && groupMentions > 0) || tunreadGroup?.length) {
		backgroundColor = themes[theme].mentionGroupColor;
	} else if (tunread && tunread?.length > 0) {
		backgroundColor = themes[theme].tunreadColor;
	}

	return {
		backgroundColor,
		color
	};
};
