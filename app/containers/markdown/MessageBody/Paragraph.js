import React from 'react';
import PropTypes from 'prop-types';

import Inline from './Inline';

const Paragraph = ({ value, mentions }) => <Inline value={value} mentions={mentions} />;

Paragraph.propTypes = {
	value: PropTypes.string,
	mentions: PropTypes.string
};

export default Paragraph;
