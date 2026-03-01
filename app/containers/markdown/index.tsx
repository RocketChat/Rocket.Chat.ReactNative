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

const SKIN_TONE_MODIFIERS = [
	'\u{1F3FB}', // Light Skin Tone
	'\u{1F3FC}', // Medium-Light Skin Tone
	'\u{1F3FD}', // Medium Skin Tone
	'\u{1F3FE}', // Medium-Dark Skin Tone
	'\u{1F3FF}' // Dark Skin Tone
];

const ZERO_WIDTH_JOINER = '\u200D';

const isSkinToneModifier = (unicode: string): boolean => SKIN_TONE_MODIFIERS.includes(unicode);

const startsWithEmojiModifier = (text: string): boolean => {
	if (!text) return false;

	for (const tone of SKIN_TONE_MODIFIERS) {
		if (text.startsWith(tone)) return true;
	}

	return text.startsWith(ZERO_WIDTH_JOINER);
};

const extractEmojiModifiers = (text: string): { modifiers: string; remaining: string } => {
	let modifiers = '';
	let remaining = text;

	while (remaining.length > 0) {
		let matched = false;

		for (const tone of SKIN_TONE_MODIFIERS) {
			if (remaining.startsWith(tone)) {
				modifiers += tone;
				remaining = remaining.slice(tone.length);
				matched = true;
				break;
			}
		}

		if (!matched) {
			if (remaining.startsWith(ZERO_WIDTH_JOINER)) {
				modifiers += ZERO_WIDTH_JOINER;
				remaining = remaining.slice(ZERO_WIDTH_JOINER.length);
				matched = true;
			}
		}

		if (!matched) {
			const char = remaining.charAt(0);
			const codePoint = char.codePointAt(0);
			if (
				codePoint &&
				((codePoint >= 0x2600 && codePoint <= 0x27bf) || // Misc symbols
					(codePoint >= 0x1f300 && codePoint <= 0x1f9ff) || // Emoji ranges
					(codePoint >= 0xfe00 && codePoint <= 0xfe0f)) // Variation selectors
			) {
				modifiers += char;
				remaining = remaining.slice(char.length);
			} else {
				break;
			}
		}
	}

	return { modifiers, remaining };
};

const combineEmojisWithSkinTones = (items: any[]): any[] => {
	if (!Array.isArray(items) || items.length === 0) return items;

	const combined: any[] = [];
	let i = 0;

	while (i < items.length) {
		const current = items[i];

		if (current?.type === 'EMOJI' && i + 1 < items.length && items[i + 1]?.type === 'PLAIN_TEXT') {
			const nextText = items[i + 1].value;

			if (startsWithEmojiModifier(nextText)) {
				const { modifiers, remaining } = extractEmojiModifiers(nextText);

				combined.push({
					...current,
					unicode: current.unicode + modifiers
				});

				if (remaining) {
					combined.push({
						type: 'PLAIN_TEXT',
						value: remaining
					});
				}

				i += 2;
				continue;
			}
		}

		if (
			current?.type === 'EMOJI' &&
			i + 1 < items.length &&
			items[i + 1]?.type === 'EMOJI' &&
			isSkinToneModifier(items[i + 1].unicode)
		) {
			combined.push({
				...current,
				unicode: current.unicode + items[i + 1].unicode
			});
			i += 2;
			continue;
		}

		combined.push(current);
		i += 1;
	}

	return combined;
};

const processBlock = (block: any): any => {
	if (!block || typeof block !== 'object') return block;

	if (Array.isArray(block.value)) {
		const processedValue = combineEmojisWithSkinTones(block.value.map((item: any) => processBlock(item)));
		return { ...block, value: processedValue };
	}

	if (block.items && Array.isArray(block.items)) {
		return {
			...block,
			items: block.items.map((item: any) => processBlock(item))
		};
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

	if (isEmpty(tokens)) return null;

	const processedTokens = tokens.map(block => processBlock(block));

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
				{processedTokens?.map(block => {
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
		</View>
	);
};

export default Markdown;
