import { themes } from '../../constants/colors';

export const getUnreadStyle = ({
	unread, userMentions, groupMentions, theme, tunread, tunreadUser, tunreadGroup
}) => {
	if ((!unread || unread <= 0) && (!tunread?.length)) {
		return {};
	}

	let backgroundColor = themes[theme].unreadColor;
	const color = themes[theme].buttonText;
	if (userMentions > 0 || tunreadUser?.length) {
		backgroundColor = themes[theme].mentionMeColor;
	} else if (groupMentions > 0 || tunreadGroup?.length) {
		backgroundColor = themes[theme].mentionGroupColor;
	} else if (tunread?.length > 0) {
		backgroundColor = themes[theme].tunreadColor;
	}

	return {
		backgroundColor, color
	};
};
