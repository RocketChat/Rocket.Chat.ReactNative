import moment from 'moment';

import { sendFileMessage, sendMessage } from '../../lib/methods';
import { Services } from '../../lib/services';
import { TAnyMessageModel } from '../../definitions';
import { themeColors } from '../../lib/constants';

export const getColor = (color: string) => {
	const colorRegex = /^(#([A-Fa-f0-9]{3}){1,2}|(rgb|hsl)a?\([-.\d\s%,]+\))$/i;
	const isColor = colorRegex.test(color);

	if (isColor) {
		return color;
	}

	if (themeColors[color]) {
		return themeColors[color];
	}
};

export const getIcon = (icon: string) => {
	let imagePath;
	switch (icon) {
		// case 'covid':
		// 	imagePath = require('../../static/images/discussionboard/covid.png');
		// 	break;
		// case 'diet':
		// 	imagePath = require('../../static/images/discussionboard/diet.png');
		// 	break;
		// case 'exercising':
		// 	imagePath = require('../../static/images/discussionboard/exercising.png');
		// 	break;
		// case 'insulin':
		// 	imagePath = require('../../static/images/discussionboard/insulin.png');
		// 	break;
		// case 'mdi_users':
		// 	imagePath = require('../../static/images/discussionboard/mdi_users.png');
		// 	break;
		// case 'syringe':
		// 	imagePath = require('../../static/images/discussionboard/syringe.png');
		// 	break;
		case 'solidStar':
			imagePath = require(`../../static/images/discussionboard/star_solid.png`);
			break;
		case 'outlineStar':
			imagePath = require(`../../static/images/discussionboard/star_outline.png`);
			break;
		case 'solidSave':
			imagePath = require('../../static/images/discussionboard/save_solid.png');
			break;
		case 'outlineSave':
			imagePath = require('../../static/images/discussionboard/save.png');
			break;
		case 'like':
			imagePath = require('../../static/images/discussionboard/like.png');
			break;
		case 'comment':
			imagePath = require('../../static/images/discussionboard/comment.png');
			break;
		case 'arrowRight':
			imagePath = require('../../static/images/discussionboard/arrow_right.png');
			break;
		case 'arrowLeft':
			imagePath = require('../../static/images/discussionboard/arrow_left.png');
			break;
		case 'discussionBoardIcon':
			imagePath = require('../../static/images/discussion-solid.png');
			break;
		case 'arrowDown':
			imagePath = require('../../static/images/discussionboard/arrow_down.png');
			break;
		case 'selectImage':
			imagePath = require('../../static/images/discussionboard/image_picker.png');
			break;
		case 'more':
			imagePath = require('../../static/images/discussionboard/more.png');
			break;
		case 'send':
			imagePath = require('../../static/images/discussionboard/send.png');
			break;
		case 'saveMedia':
			imagePath = require("../../static/images/discussionboard/save_media_new.png");
			break;
		case 'boardUsers':
			imagePath = require('../../static/images/discussionboard/board_users.png');
			break;

		default:
			imagePath = require('../../static/images/discussionboard/image_picker.png');
			break;
	}
	return imagePath;
};

export const handleStar = async (message: TAnyMessageModel, callback?: () => void) => {
	try {
		await Services.toggleStarMessage(message.id, message.starred as boolean); // TODO: reevaluate `message.starred` type on IMessage
		if (callback) {
			callback();
		}
	} catch (e) {
		console.log('e', e);
	}
};

export const handleSendMessage = async ({
	message,
	tshow,
	rid,
	callBack,
	hasAttachment,
	fileInfo,
	server,
	user
}: {
	message: string;
	tshow?: boolean;
	rid: string;
	callBack: () => void;
	hasAttachment?: boolean;
	fileInfo?: any;
	server?: string;
	user?: any;
}) => {
	if (hasAttachment) {
		await sendFileMessage(rid, fileInfo, undefined, server, user);
		if (callBack) {
			callBack();
		}
	} else {
		sendMessage(rid, message, undefined, user, tshow).then(() => {
			if (callBack) {
				callBack();
			}
		});
	}
};

export const getDate = (date: string, format?: string) => {
	const formattedDate = moment(date).format(format ?? 'MMMM D, YYYY - h:MMa');
	return moment(date) ? formattedDate : '';
};
