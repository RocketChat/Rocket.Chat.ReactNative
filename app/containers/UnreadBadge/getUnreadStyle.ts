import { IUnreadBadge } from '.';
import { themes } from '../../lib/constants/colors';
import { TSupportedThemes } from '../../theme';

interface IGetUnreadStyle extends Omit<IUnreadBadge, 'small' | 'style'> {
	theme: TSupportedThemes;
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

	let backgroundColor = themes[theme].fontAnnotation;
	const color = themes[theme].fontWhite;
	if ((userMentions && userMentions > 0) || tunreadUser?.length) {
		backgroundColor = themes[theme].badgeBackgroundLevel4;
	} else if ((groupMentions && groupMentions > 0) || tunreadGroup?.length) {
		backgroundColor = themes[theme].badgeBackgroundLevel3;
	} else if (tunread && tunread?.length > 0) {
		backgroundColor = theme === 'light' ? themes[theme].fontInfo : themes[theme].buttonBackgroundPrimaryPress;
	}

	return {
		backgroundColor,
		color
	};
};
