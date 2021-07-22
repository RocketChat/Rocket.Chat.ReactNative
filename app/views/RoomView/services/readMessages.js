import RocketChat from '../../../lib/rocketchat';

const readMessages = (rid, newLastOpen) => RocketChat.readMessages(rid, newLastOpen, true);

export default readMessages;
