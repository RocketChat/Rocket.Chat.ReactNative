import RocketChat from '../../../lib/rocketchat';

const getThreadMessages = (tmid, rid) => RocketChat.loadThreadMessages({ tmid, rid });

export default getThreadMessages;
