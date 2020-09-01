import React from 'react';
import PropTypes from 'prop-types';

import Sort from './Sort';

import OmnichannelStatus from '../../../ee/omnichannel/containers/OmnichannelStatus';

const ListHeader = React.memo(({
	searching,
	sortBy,
	toggleSort,
	goQueue,
	queueSize,
	inquiryEnabled,
	user
}) => (
	<>
		<Sort searching={searching} sortBy={sortBy} toggleSort={toggleSort} />
		<OmnichannelStatus searching={searching} goQueue={goQueue} inquiryEnabled={inquiryEnabled} queueSize={queueSize} user={user} />
	</>
));

ListHeader.propTypes = {
	searching: PropTypes.bool,
	sortBy: PropTypes.string,
	toggleSort: PropTypes.func,
	goQueue: PropTypes.func,
	queueSize: PropTypes.number,
	inquiryEnabled: PropTypes.bool,
	user: PropTypes.object
};

export default ListHeader;
