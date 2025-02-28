import React from 'react';
import { StyleProp, TextStyle } from 'react-native';
import { parse } from '@rocket.chat/message-parser';
import type { Root } from '@rocket.chat/message-parser';
import isEmpty from 'lodash/isEmpty';

import { IUserMention, IUserChannel, TOnLinkPress } from './interfaces';
import { TGetCustomEmoji } from '../../definitions/IEmoji';
import MarkdownContext from './contexts/MarkdownContext';
import LineBreak from './components/LineBreak';
import { KaTeX } from './components/Katex';
import { BigEmoji } from './components/emoji';
import UnorderedList from './components/list/UnorderedList';
import OrderedList from './components/list/OrderedList';
import TaskList from './components/list/TaskList';
import Quote from './components/Quote';
import Paragraph from './components/Paragraph';
import { Code } from './components/code';
import Heading from './components/Heading';
import log from '../../lib/methods/helpers/log';

export { default as MarkdownPreview } from './components/Preview';

interface IMarkdownProps {
	msg?: string | null;
	md?: Root;
	mentions?: IUserMention[];
	getCustomEmoji?: TGetCustomEmoji;
	username?: string;
	tmid?: string;
	numberOfLines?: number;
	customEmojis?: boolean;
	useRealName?: boolean;
	channels?: IUserChannel[];
	enableMessageParser?: boolean;
	// TODO: Refactor when migrate Room
	navToRoomInfo?: Function;
	testID?: string;
	style?: StyleProp<TextStyle>[];
	onLinkPress?: TOnLinkPress;
	isTranslated?: boolean;
}

const Markdown: React.FC<IMarkdownProps> = ({
	msg,
	md,
	mentions,
	channels,
	navToRoomInfo,
	useRealName,
	username = '',
	getCustomEmoji,
	onLinkPress,
	isTranslated
}: IMarkdownProps) => {
	if (!msg) return null;

	let tokens;
	try {
		tokens = !isTranslated && md ? md : parse(typeof msg === 'string' ? msg : String(msg || ''));
	} catch (e) {
		log(e);
		return null;
	}

	if (isEmpty(tokens)) return null;

	return (
		<MarkdownContext.Provider
			value={{
				mentions,
				channels,
				useRealName,
				username,
				navToRoomInfo,
				getCustomEmoji,
				onLinkPress
			}}>
			{tokens?.map(block => {
				switch (block.type) {
					case 'BIG_EMOJI':
						return <BigEmoji value={block.value} />;
					case 'UNORDERED_LIST':
						return <UnorderedList value={block.value} />;
					case 'ORDERED_LIST':
						return <OrderedList value={block.value} />;
					case 'TASKS':
						return <TaskList value={block.value} />;
					case 'QUOTE':
						return <Quote value={block.value} />;
					case 'PARAGRAPH':
						return <Paragraph value={block.value} />;
					case 'CODE':
						return <Code value={block.value} />;
					case 'HEADING':
						return <Heading value={block.value} level={block.level} />;
					case 'LINE_BREAK':
						return <LineBreak />;
					// This prop exists, but not even on the web it is treated, so...
					// https://github.com/RocketChat/Rocket.Chat/blob/develop/packages/gazzodown/src/Markup.tsx
					// case 'LIST_ITEM':
					// 	return <View />;
					case 'KATEX':
						return <KaTeX value={block.value} />;
					default:
						return null;
				}
			})}
		</MarkdownContext.Provider>
	);
};

export default Markdown;
