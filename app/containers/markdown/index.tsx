import { type FC } from 'react';
import { type StyleProp, type TextStyle, View } from 'react-native';
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
import styles from './styles';

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
	textStyle?: StyleProp<TextStyle>;
}

type MarkdownBlock = Root[number];

const PARSE_CACHE_MAX = 200;
const parseCache = new Map<string, Root>();

const parseMessage = (msg: string): Root => {
	const cached = parseCache.get(msg);
	if (cached) {
		return cached;
	}

	const result = parse(msg);

	if (parseCache.size >= PARSE_CACHE_MAX) {
		const oldestKey = parseCache.keys().next().value;
		if (oldestKey !== undefined) {
			parseCache.delete(oldestKey);
		}
	}

	parseCache.set(msg, result);
	return result;
};

const resolveTokens = (msg: string, md: Root | undefined, isTranslated?: boolean): Root => {
	if (!isTranslated && md) {
		return md;
	}

	return parseMessage(typeof msg === 'string' ? msg : String(msg || ''));
};

const MarkdownBlockView = ({ block }: { block: MarkdownBlock }) => {
	'use memo';

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
};

const Markdown: FC<IMarkdownProps> = ({
	msg,
	md,
	mentions,
	channels,
	navToRoomInfo,
	useRealName,
	username = '',
	getCustomEmoji,
	onLinkPress,
	isTranslated,
	textStyle
}: IMarkdownProps) => {
	'use memo';

	let tokens: Root | null = null;

	if (msg) {
		try {
			const result = resolveTokens(msg, md, isTranslated);
			tokens = isEmpty(result) ? null : result;
		} catch (e) {
			log(e);
		}
	}

	const contextValue = {
		mentions,
		channels,
		useRealName,
		username,
		navToRoomInfo,
		getCustomEmoji,
		onLinkPress,
		textStyle
	};

	if (!tokens) {
		return null;
	}

	return (
		<View style={styles.blocks}>
			<MarkdownContext.Provider value={contextValue}>
				{tokens.map((block, index) => (
					<MarkdownBlockView key={`${block.type}-${index}`} block={block} />
				))}
			</MarkdownContext.Provider>
		</View>
	);
};

export default Markdown;
