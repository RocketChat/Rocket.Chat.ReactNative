import React from 'react';
import PropTypes from 'prop-types';

import Queue from './Queue';
import Sort from './Sort';

const ListHeader = React.memo(({
	searching,
	sortBy,
	toggleSort,
	goQueue,
	queueSize,
	inquiryEnabled
}) => (
	<>
		<Sort searching={searching} sortBy={sortBy} toggleSort={toggleSort} />
		<Queue searching={searching} goQueue={goQueue} queueSize={queueSize} inquiryEnabled={inquiryEnabled} />
	</>
));

ListHeader.propTypes = {
	searching: PropTypes.bool,
	sortBy: PropTypes.string,
	toggleSort: PropTypes.func,
	goQueue: PropTypes.func,
	queueSize: PropTypes.number,
	inquiryEnabled: PropTypes.bool
};

export default ListHeader;
