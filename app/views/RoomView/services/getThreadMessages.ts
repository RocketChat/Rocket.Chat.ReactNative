import RocketChat from '../../../lib/rocketchat';

// unlike getMessages, sync isn't required for threads, because loadMissedMessages does it already
const getThreadMessages = (tmid: string, rid: string): Promise<void> => RocketChat.loadThreadMessages({ tmid, rid });

export default getThreadMessages;
