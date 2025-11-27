import React from 'react';
import { View } from 'react-native';
import { parse } from '@rocket.chat/message-parser';
import type { Root } from '@rocket.chat/message-parser';
import isEmpty from 'lodash/isEmpty';

import { type IUserMention, type IUserChannel, type TOnLinkPress } from './interfaces';
import { type TGetCustomEmoji } from '../../definitions/IEmoji';
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
	useRealName?: boolean;
	channels?: IUserChannel[];
	navToRoomInfo?: Function;
	onLinkPress?: TOnLinkPress;
	isTranslated?: boolean;
}

const generateId = (size = 16) => {
	const rand = Math.random().toString(36).slice(2);
	const time = Date.now().toString(36);
	return (rand + time).slice(-size); // use from end
};

const assignIds = (block: any) => {
	if (!block._id) {
		const id = generateId();
		block._id = id;
	}

	// add to nested
	if (Array.isArray(block.value)) {
		block.value = block.value.map((child: any) => assignIds(child));
	}

	if (Array.isArray(block.blocks)) {
		block.blocks = block.blocks.map((child: any) => assignIds(child));
	}
	return block;
};
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

	tokens = tokens.map(assignIds);

	if (isEmpty(tokens)) return null;
	return (
		<View style={{ gap: 2 }}>
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
							return <BigEmoji key={block._id} value={block.value} />;
						case 'UNORDERED_LIST':
							return <UnorderedList key={block._id} value={block.value} />;
						case 'ORDERED_LIST':
							return <OrderedList key={block._id} value={block.value} />;
						case 'TASKS':
							return <TaskList key={block._id} value={block.value} />;
						case 'QUOTE':
							return <Quote key={block._id} value={block.value} />;
						case 'PARAGRAPH':
							return <Paragraph key={block._id} value={block.value} />;
						case 'CODE':
							return <Code key={block._id} value={block.value} />;
						case 'HEADING':
							return <Heading key={block._id} value={block.value} level={block.level} />;
						case 'LINE_BREAK':
							return <LineBreak key={block._id} />;
						// This prop exists, but not even on the web it is treated, so...
						// https://github.com/RocketChat/Rocket.Chat/blob/develop/packages/gazzodown/src/Markup.tsx
						// case 'LIST_ITEM':
						// 	return <View />;
						case 'KATEX':
							return <KaTeX key={block._id} value={block.value} />;
						default:
							return null;
					}
				})}
			</MarkdownContext.Provider>
		</View>
	);
};

export default Markdown;
