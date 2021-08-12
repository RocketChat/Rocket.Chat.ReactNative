import React from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';

import Link from './Link';
import Plain from './Plain';
import Code from './Code';
import Bold from './Bold';
import Strike from './Strike';
import Italic from './Italic';
import Emoji from './Emoji';

const Inline = ({ value }) => (
	<Text>
		{value.map((block) => {
			switch (block.type) {
				case 'PLAIN_TEXT':
					return <Plain value={block.value} />;
				case 'BOLD':
					return <Bold value={block.value} />;
				case 'STRIKE':
					return <Strike value={block.value} />;
				case 'ITALIC':
					return <Italic value={block.value} />;
				case 'LINK':
					// eslint-disable-next-line jsx-a11y/anchor-is-valid
					return <Link value={block.value} />;
					// case 'MENTION_USER':
					// 	return <Mention value={block.value} mentions={mentions} />;
				case 'EMOJI':
					return <Emoji emojiHandle={`:${ block.value.value }:`} />;
				// case 'MENTION_CHANNEL':
				// 	// case 'COLOR':
				// 	return <Plain value={block.value} />;
				case 'INLINE_CODE':
					return <Code value={block.value} />;
				default:
					return null;
			}
		})}
	</Text>
);

Inline.propTypes = {
	value: PropTypes.object
};

export default Inline;
