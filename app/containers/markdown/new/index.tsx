import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { MarkdownAST, BigEmoji as BigEmojiProps } from '@rocket.chat/message-parser';

import Quote from './Quote';
import Paragraph from './Paragraph';
import Heading from './Heading';
import Code from './Code';
import BigEmoji from './BigEmoji';
import OrderedList from './OrderedList';
import UnorderedList from './UnorderedList';
import { UserMention } from '../../message/interfaces';
import TaskList from './TaskList';

interface IBodyProps {
	tokens: MarkdownAST;
	mentions: UserMention[];
	channels: {
		name: string;
		_id: number;
	}[];
	navToRoomInfo: Function;
	style: StyleProp<ViewStyle>[];
}

const isBigEmoji = (tokens: MarkdownAST): tokens is [BigEmojiProps] => tokens.length === 1 && tokens[0].type === 'BIG_EMOJI';

const Body = ({ tokens, mentions, channels, navToRoomInfo, style }: IBodyProps): JSX.Element => {
	if (isBigEmoji(tokens)) {
		return <BigEmoji value={tokens[0].value} />;
	}

	return (
		<>
			{tokens.map(block => {
				switch (block.type) {
					case 'UNORDERED_LIST':
						return <UnorderedList value={block.value} />;
					case 'ORDERED_LIST':
						return <OrderedList value={block.value} />;
					case 'TASKS':
						return <TaskList value={block.value} />;
					case 'QUOTE':
						return <Quote value={block.value} />;
					case 'PARAGRAPH':
						return (
							<Paragraph
								value={block.value}
								navToRoomInfo={navToRoomInfo}
								channels={channels}
								mentions={mentions}
								style={style}
							/>
						);
					case 'CODE':
						return <Code value={block.value} style={style} />;
					case 'HEADING':
						return <Heading value={block.value} level={block.level} />;
					default:
						return null;
				}
			})}
		</>
	);
};

export default Body;
