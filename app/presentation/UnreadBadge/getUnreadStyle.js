import { themes } from '../../constants/colors';

export const getUnreadStyle = ({
	unread, tunread, userMentions, groupMentions, theme
}) => {
	if ((!unread || unread <= 0) && (!tunread?.length)) {
		return {};
	}

	let text = unread || tunread.length;
	if (text >= 1000) {
		text = '999+';
	}

	let backgroundColor = themes[theme].unreadBackground;
	const color = themes[theme].buttonText;
	if (userMentions > 0) {
		backgroundColor = themes[theme].mentionMeBackground;
	} else if (groupMentions > 0) {
		backgroundColor = themes[theme].mentionGroupBackground;
	} else if (tunread?.length > 0) {
		backgroundColor = themes[theme].tunreadBackground;
	}

	return {
		backgroundColor, color
	};
};
