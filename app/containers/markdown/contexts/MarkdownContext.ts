import React from 'react';

import { IUserMention, IUserChannel } from '../interfaces';

interface IMarkdownContext {
	mentions?: IUserMention[];
	channels?: IUserChannel[];
	useRealName?: boolean;
	username?: string;
	navToRoomInfo?: Function;
	getCustomEmoji?: Function;
	onLinkPress?: Function;
}

const defaultState = {
	mentions: [],
	channels: [],
	useRealName: false,
	username: '',
	navToRoomInfo: () => {}
};

const MarkdownContext = React.createContext<IMarkdownContext>(defaultState);
export default MarkdownContext;
