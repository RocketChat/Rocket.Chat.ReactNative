import rocketchat from '../lib/rocketchat';

type TRocketChat = typeof rocketchat;

export interface IRocketChatThis extends TRocketChat {
	sdk: any;
}
