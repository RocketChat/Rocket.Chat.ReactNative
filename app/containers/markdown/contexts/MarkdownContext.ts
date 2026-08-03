import { createContext, useContext } from 'react';
import { type StyleProp, type TextStyle } from 'react-native';

import { type IUserMention, type IUserChannel } from '../interfaces';

interface IMarkdownContext {
	mentions?: IUserMention[];
	channels?: IUserChannel[];
	useRealName?: boolean;
	username?: string;
	navToRoomInfo?: Function;
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

export const useMarkdownContext = (overrides?: Partial<IMarkdownContext>): IMarkdownContext => {
	const context = useContext(MarkdownContext);
	if (!overrides) return context;

	// Merge the context and overrides
	const newContext = { ...context, ...overrides };

	// Deep merge textStyle if both exist
	if (context.textStyle && overrides.textStyle) {
		newContext.textStyle = [
			...(Array.isArray(context.textStyle) ? context.textStyle : [context.textStyle]),
			...(Array.isArray(overrides.textStyle) ? overrides.textStyle : [overrides.textStyle])
		];
	}

	return newContext;
};

export default MarkdownContext;
