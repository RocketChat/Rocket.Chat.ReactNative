import moment from 'moment';

import parseUrls from './parseUrls';

function normalizeAttachments(msg) {
	if (typeof msg.attachments !== typeof [] || !msg.attachments || !msg.attachments.length) {
		msg.attachments = [];
	}
	msg.attachments = msg.attachments.map((att) => {
		att.fields = att.fields || [];
		if (att.ts) {
			att.ts = moment(att.ts).toDate();
		}
		att = normalizeAttachments(att);
		return att;
	});
	return msg;
}

export default (msg) => {
	if (!msg) { return; }
	msg = normalizeAttachments(msg);
	msg.reactions = msg.reactions || [];
	// TODO: api problems
	// if (Array.isArray(msg.reactions)) {
	// 	msg.reactions = msg.reactions.map((value, key) => ({ emoji: key, usernames: value.usernames.map(username => ({ value: username })) }));
	// } else {
	// 	msg.reactions = Object.keys(msg.reactions).map(key => ({ emoji: key, usernames: msg.reactions[key].usernames.map(username => ({ value: username })) }));
	// }
	if (!Array.isArray(msg.reactions)) {
		msg.reactions = Object.keys(msg.reactions).map(key => ({ _id: `${ msg._id }${ key }`, emoji: key, usernames: msg.reactions[key].usernames.map(username => ({ value: username })) }));
	}
	msg.urls = msg.urls ? parseUrls(msg.urls) : [];
	msg._updatedAt = new Date();
	// loadHistory returns msg.starred as object
	// stream-room-msgs returns msg.starred as an array
	msg.starred = msg.starred && (Array.isArray(msg.starred) ? msg.starred.length > 0 : !!msg.starred);
	return msg;
};
