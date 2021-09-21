/* eslint-disable react/no-array-index-key */
import React from 'react';
import PropTypes from 'prop-types';

import Quote from './Quote';
import Paragraph from './Paragraph';
import Heading from './Heading';
import Code from './Code';
import Link from './Link';
import BigEmoji from './BigEmoji';
import OrderedList from './OrderedList';
import UnorderedList from './UnorderedList';

const isBigEmoji = tokens => tokens.length === 1 && tokens[0].type === 'BIG_EMOJI';

const Body = ({ tokens, mentions, channels, navToRoomInfo, style }) => {
	if (isBigEmoji(tokens)) {
		return <BigEmoji value={tokens[0].value} />;
	}

	return (
		<>
			{tokens.map((block, index) => {
				switch (block.type) {
					case 'UNORDERED_LIST':
						return <UnorderedList key={index} value={block.value} />;
					case 'ORDERED_LIST':
						return <OrderedList key={index} value={block.value} />;
					case 'TASK':
						return <OrderedList key={index} value={block.value} />;
					case 'QUOTE':
						return <Quote key={index} value={block.value} />;
					case 'PARAGRAPH':
						return (
							<Paragraph
								key={index}
								value={block.value}
								navToRoomInfo={navToRoomInfo}
								channels={channels}
								mentions={mentions}
								style={style}
							/>
						);
					case 'CODE':
						return <Code key={index} value={block.value} style={style} />;
					case 'LINK':
						// eslint-disable-next-line jsx-a11y/anchor-is-valid
						return <Link key={index} value={block.value} />;
					case 'HEADING':
						return <Heading key={index} value={block.value} level={block.level} />;
					default:
						return null;
				}
			})}
		</>
	);
};

Body.propTypes = {
	tokens: PropTypes.array,
	mentions: PropTypes.array,
	channels: PropTypes.array,
	navToRoomInfo: PropTypes.func,
	style: PropTypes.oneOfType([PropTypes.array, PropTypes.object])
};

export default Body;
