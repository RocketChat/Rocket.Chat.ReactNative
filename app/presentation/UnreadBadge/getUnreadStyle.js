import { themes } from '../../constants/colors';

export const getUnreadStyle = ({
	unread, userMentions, groupMentions, theme, tunread, tunreadUser, tunreadGroup
}) => {
	if ((!unread || unread <= 0) && (!tunread?.length)) {
		return {};
	}

	let backgroundColor = themes[theme].unreadBackground;
	const color = themes[theme].buttonText;
	if (userMentions > 0 || tunreadUser?.length) {
		backgroundColor = themes[theme].mentionMeBackground;
	} else if (groupMentions > 0 || tunreadGroup?.length) {
		backgroundColor = themes[theme].mentionGroupBackground;
	} else if (tunread?.length > 0) {
		backgroundColor = themes[theme].tunreadBackground;
	}

	return {
		backgroundColor, color
	};
};
