import React from 'react';

import { ISubscription, SubscriptionType, IUser } from '../../../definitions';
import { ILivechatVisitorModified } from '../../../definitions/ILivechatVisitor';
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
}): React.ReactElement => {
	if (isDirect) {
		return <Direct roomUser={roomUser as IUser} />;
	}

	if (room?.t === SubscriptionType.OMNICHANNEL && room) {
		return <Livechat room={room} roomUser={roomUser as ILivechatVisitorModified} />;
	}

	return <Channel room={room} />;
};

export default RoomInfoViewBody;
