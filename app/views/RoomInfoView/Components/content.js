import React from 'react';
import Livechat from '../Livechat';
import Channel from '../Channel';
import Direct from '../Direct';

const Content = (room, roomUser, theme, isDirect, type) => {
	if (isDirect) {
		return <Direct roomUser={roomUser} theme={theme} />;
	} else if (type === 'l') {
		return <Livechat room={room} roomUser={roomUser} theme={theme} />;
	}
	return <Channel room={room} theme={theme} />;
};

export default Content;
