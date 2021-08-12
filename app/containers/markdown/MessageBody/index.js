/* eslint-disable react/no-array-index-key */
import React from 'react';
import PropTypes from 'prop-types';

import List from './List';
import Quote from './Quote';
import Paragraph from './Paragraph';
import Heading from './Heading';
import Code from './Code';
import Link from './Link';
import BigEmoji from './BigEmoji';
import { useTheme } from '../../../theme';

const isBigEmoji = tokens => tokens.length === 1 && tokens[0].type === 'BIG_EMOJI';

const Body = ({ tokens, mentions }) => {
	const { theme } = useTheme();
	if (isBigEmoji(tokens)) {
		return <BigEmoji value={tokens[0].value} theme={theme} />;
	}

	return (
		<>
			{tokens.map((block, index) => {
				switch (block.type) {
					case 'UNORDERED_LIST':
						return <List type={block.type} value={block.value} key={index} />;
					case 'ORDERED_LIST':
						return <List type={block.type} value={block.value} key={index} />;
					case 'TASK':
						return <List type={block.type} value={block.value} key={index} />;
					case 'QUOTE':
						return <Quote key={index} value={block.value} />;
					case 'PARAGRAPH':
						return <Paragraph key={index} value={block.value} mentions={mentions} />;
					case 'CODE':
						return <Code key={index} value={block.value} />;
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
	mentions: PropTypes.array
};

export default Body;
