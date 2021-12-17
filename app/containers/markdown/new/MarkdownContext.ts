import React from 'react';

import { UserMention, UserChannel } from '../interfaces';

interface IMarkdownContext {
	mentions?: UserMention[];
	channels?: UserChannel[];
	useRealName?: boolean;
	username?: string;
	baseUrl?: string;
	navToRoomInfo?: Function;
	getCustomEmoji?: Function;
	onLinkPress?: Function;
}

const defaultState = {
	mentions: [],
	channels: [],
	useRealName: false,
	username: '',
	baseUrl: '',
	navToRoomInfo: () => {}
};

const MarkdownContext = React.createContext<IMarkdownContext>(defaultState);
export default MarkdownContext;
