import React from 'react';

import { ISubscription, SubscriptionType, TUserParsed } from '../../../definitions';
import { ILivechatVisitorModified } from '../../../definitions/ILivechatVisitor';
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
	roomUser: TUserParsed | ILivechatVisitorModified;
	room?: ISubscription;
	type: SubscriptionType;
}): React.ReactElement => {
	if (isDirect) {
		return <Direct roomUser={roomUser as TUserParsed} />;
	}

	if (type === SubscriptionType.OMNICHANNEL && room) {
		return <Livechat room={room} roomUser={roomUser as ILivechatVisitorModified} />;
	}
	return <Channel room={room} />;
};

export default RoomInfoViewBody;
