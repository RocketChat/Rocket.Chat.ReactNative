import React from 'react';

import { ISubscription, SubscriptionType } from '../../../definitions';
import Channel from '../Channel';
import Direct from '../Direct';
import Livechat from '../Livechat';
import { ILivechatVisitorModified } from '../../../definitions/ILivechatVisitor';

const RoomInfoViewBody = ({
	isDirect,
	roomUser,
	room,
	type
}: {
	isDirect: boolean;
	roomUser: ILivechatVisitorModified;
	room?: ISubscription;
	type: SubscriptionType;
}): React.ReactElement => {
	if (isDirect) {
		return <Direct roomUser={roomUser} />;
	}

	if (type === SubscriptionType.OMNICHANNEL && room) {
		return <Livechat room={room} roomUser={roomUser} />;
	}
	return <Channel room={room} />;
};

export default RoomInfoViewBody;
