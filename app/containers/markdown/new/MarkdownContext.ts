import React from 'react';

import { UserMention } from '../../message/interfaces';

interface IMarkdownContext {
	mentions: UserMention[];
	channels: {
		name: string;
		_id: number;
	}[];
	navToRoomInfo: Function;
	useRealName: boolean;
	username: string;
	baseUrl: string;
	getCustomEmoji?: Function;
}

const defaultState = {
	mentions: [],
	channels: [],
	navToRoomInfo: () => {},
	useRealName: false,
	username: '',
	baseUrl: ''
};

const MarkdownContext = React.createContext<IMarkdownContext>(defaultState);
export default MarkdownContext;
