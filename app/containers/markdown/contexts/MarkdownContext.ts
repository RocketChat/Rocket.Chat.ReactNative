import { createContext, useContext, useMemo } from 'react';
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

export const useMarkdownContext = (textStyle?: StyleProp<TextStyle>): IMarkdownContext => {
	const context = useContext(MarkdownContext);

	return useMemo(() => {
		if (!textStyle) return context;
		if (!context.textStyle) return { ...context, textStyle };

		return {
			...context,
			textStyle: [
				...(Array.isArray(context.textStyle) ? context.textStyle : [context.textStyle]),
				...(Array.isArray(textStyle) ? textStyle : [textStyle])
			]
		};
	}, [context, textStyle]);
};

export default MarkdownContext;
