import React from 'react';

import { ILivechatVisitorModified, IUserParsed } from '..';
import { ISubscription, SubscriptionType } from '../../../definitions';
import Channel from '../Channel';
import Direct from '../Direct';
import Livechat from '../Livechat';

const RoomInfoViewBody = ({
	isDirect,
	roomUser,
	room,
	type
}: {
	isDirect: boolean;
	roomUser: IUserParsed | ILivechatVisitorModified;
	room: ISubscription;
	type: SubscriptionType;
}): React.ReactElement => {
	if (isDirect) {
		return <Direct roomUser={roomUser as IUserParsed} />;
	}

	if (type === SubscriptionType.OMNICHANNEL) {
		return <Livechat room={room} roomUser={roomUser as ILivechatVisitorModified} />;
	}
	return <Channel room={room} />;
};

export default RoomInfoViewBody;
