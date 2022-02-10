import rocketchat from '../lib/rocketchat';

export type TRocketChat = typeof rocketchat;

export interface IRocketChat extends TRocketChat {
	sdk?: any;
	activeUsersSubTimeout?: any;
	roomsSub?: any;
}
