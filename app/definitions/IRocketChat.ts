import rocketchat from '../lib/rocketchat';

type TRocketChat = typeof rocketchat;

export interface IRocketChat extends TRocketChat {
	sdk: any;
	activeUsersSubTimeout: any;
	roomsSub: any;
}
