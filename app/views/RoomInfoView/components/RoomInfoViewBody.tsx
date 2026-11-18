import { type ReactElement } from 'react';

import { type ISubscription } from '~/definitions/ISubscription';
import { RoomType } from '~/definitions/IRoom';
import { type IUser } from '~/definitions/IUser';
import { type ILivechatVisitorModified } from '~/definitions/ILivechatVisitor';
import Channel from '../Channel';
import Direct from '../Direct';
import Livechat from '../Livechat';

const RoomInfoViewBody = ({
	isDirect,
	roomUser,
	room
}: {
	isDirect: boolean;
	roomUser: IUser | ILivechatVisitorModified;
	room?: ISubscription;
}): ReactElement => {
	if (isDirect) {
		return <Direct roomUser={roomUser as IUser} />;
	}

	if (room?.t === RoomType.OMNICHANNEL && room) {
		return <Livechat room={room} roomUser={roomUser as ILivechatVisitorModified} />;
	}

	return <Channel room={room} />;
};

export default RoomInfoViewBody;
