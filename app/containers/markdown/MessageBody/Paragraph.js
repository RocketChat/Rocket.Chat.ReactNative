import React from 'react';
import PropTypes from 'prop-types';

import Inline from './Inline';

const Paragraph = ({
	value, mentions, navToRoomInfo, style
}) => <Inline value={value} mentions={mentions} navToRoomInfo={navToRoomInfo} style={style} />;

Paragraph.propTypes = {
	value: PropTypes.string,
	mentions: PropTypes.string,
	navToRoomInfo: PropTypes.func,
	style: PropTypes.oneOfType([PropTypes.array, PropTypes.object])
};

export default Paragraph;
