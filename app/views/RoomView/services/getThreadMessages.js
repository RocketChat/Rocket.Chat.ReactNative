import RocketChat from '../../../lib/rocketchat';

// unlike getMessages, sync isn't required for threads, because loadMissedMessages does it already
const getThreadMessages = (tmid, rid) => RocketChat.loadThreadMessages({ tmid, rid });

export default getThreadMessages;
