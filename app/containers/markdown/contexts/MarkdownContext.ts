import React from 'react';

import { type IUserMention, type IUserChannel } from '../interfaces';

interface IMarkdownContext {
	mentions?: IUserMention[];
	channels?: IUserChannel[];
	useRealName?: boolean;
	username?: string;
	navToRoomInfo?: Function;
	getCustomEmoji?: Function;
	onLinkPress?: Function;
	highlights?: string[];
}

const defaultState = {
	mentions: [],
	channels: [],
	useRealName: false,
	username: '',
	navToRoomInfo: () => {}
	,
	highlights: []
};

const MarkdownContext = React.createContext<IMarkdownContext>(defaultState);
export default MarkdownContext;
