import { createContext } from 'react';
import { type StyleProp, type TextStyle } from 'react-native';

import { type IUserMention, type IUserChannel } from '../interfaces';

interface IMarkdownContext {
	mentions?: IUserMention[];
	channels?: IUserChannel[];
	useRealName?: boolean;
	username?: string;
	navToRoomInfo?: Function;
	getCustomEmoji?: Function;
	onLinkPress?: Function;
	textStyle?: StyleProp<TextStyle>;
}

const defaultState = {
	mentions: [],
	channels: [],
	useRealName: false,
	username: '',
	navToRoomInfo: () => {},
	textStyle: undefined
};

const MarkdownContext = createContext<IMarkdownContext>(defaultState);
export default MarkdownContext;
