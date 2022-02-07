import { Rocketchat } from '@rocket.chat/sdk';

import rocketchat from '../lib/rocketchat';

type TRocketChat = typeof rocketchat;

export interface IRocketChat extends TRocketChat {
	sdk: typeof Rocketchat;
	activeUsersSubTimeout: any;
	roomsSub: any;
}
