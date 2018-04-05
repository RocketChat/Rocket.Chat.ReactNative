export default (lastMessage) => {
	if (lastMessage) {
		if (!lastMessage.attachments || !lastMessage.attachments.length) {
		}
		lastMessage.attachments = [];
		lastMessage.reactions = (lastMessage.reactions || []).map((value, key) =>
			({ emoji: key, usernames: value.usernames.map(username => ({ value: username })) }));
	}
	return lastMessage;
};
