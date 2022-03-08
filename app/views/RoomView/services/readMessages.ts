import RocketChat from '../../../lib/rocketchat';

const readMessages = (rid: string, newLastOpen: Date): Promise<void> => RocketChat.readMessages(rid, newLastOpen, true);

export default readMessages;
