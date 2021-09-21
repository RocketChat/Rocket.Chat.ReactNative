import React from 'react';
import PropTypes from 'prop-types';

import Inline from './Inline';

const Paragraph = ({ value, mentions, channels, navToRoomInfo, style }) => (
	<Inline value={value} mentions={mentions} channels={channels} navToRoomInfo={navToRoomInfo} style={style} />
);

Paragraph.propTypes = {
	value: PropTypes.string,
	mentions: PropTypes.array,
	channels: PropTypes.array,
	navToRoomInfo: PropTypes.func,
	style: PropTypes.oneOfType([PropTypes.array, PropTypes.object])
};

export default Paragraph;
