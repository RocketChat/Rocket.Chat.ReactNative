import React from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';

import Link from './Link';
import Plain from './Plain';
import Bold from './Bold';
import Strike from './Strike';
import Italic from './Italic';
import Emoji from './Emoji';
import Mention from './Mention';
import InlineCode from './InlineCode';
import Hashtag from '../Hashtag';


const Inline = ({
	value, mentions, channels, navToRoomInfo, style
}) => (
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
				case 'MENTION_USER':
					return <Mention value={block.value} navToRoomInfo={navToRoomInfo} mentions={mentions} style={style} />;
				case 'EMOJI':
					return <Emoji emojiHandle={`:${ block.value.value }:`} />;
				case 'MENTION_CHANNEL':
					return <Hashtag hashtag={block.value.value} navToRoomInfo={navToRoomInfo} channels={channels} style={style} />;
				case 'INLINE_CODE':
					return <InlineCode value={block.value} style={style} />;
				default:
					return null;
			}
		})}
	</Text>
);

Inline.propTypes = {
	value: PropTypes.object,
	mentions: PropTypes.array,
	channels: PropTypes.array,
	navToRoomInfo: PropTypes.func,
	style: PropTypes.oneOfType([PropTypes.array, PropTypes.object])
};

export default Inline;
