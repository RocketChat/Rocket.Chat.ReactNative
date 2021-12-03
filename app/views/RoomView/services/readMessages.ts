import RocketChat from '../../../lib/rocketchat';

const readMessages = (rid: string, newLastOpen: string): Promise<void> => RocketChat.readMessages(rid, newLastOpen, true);

export default readMessages;
