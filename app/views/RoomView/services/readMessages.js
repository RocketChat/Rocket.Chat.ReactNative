import RocketChat from '../../../lib/rocketchat/services/rocketchat';

const readMessages = (rid, newLastOpen) => RocketChat.readMessages(rid, newLastOpen, true);

export default readMessages;
