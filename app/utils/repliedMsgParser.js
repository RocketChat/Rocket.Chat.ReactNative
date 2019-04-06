export default function repliedMsgParser(msg) {
	const newMsg = msg.replace(/^\[([^\]]*)\]\(([^)]*)\)/, '').trim();
	return newMsg;
}
