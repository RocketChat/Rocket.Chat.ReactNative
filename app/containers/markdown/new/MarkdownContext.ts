import React from 'react';

import { UserMention } from '../../message/interfaces';

interface IMarkdownContext {
	mentions: UserMention[];
	channels: {
		name: string;
		_id: number;
	}[];
	useRealName: boolean;
	username: string;
	baseUrl: string;
	navToRoomInfo: Function;
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
