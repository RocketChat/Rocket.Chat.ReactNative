import React from 'react';
import PropTypes from 'prop-types';

import Banner from './Banner';

import OmnichannelStatus from '../../../ee/omnichannel/containers/OmnichannelStatus';

const ListHeader = React.memo(({
	searching,
	sortBy,
	toggleSort,
	goEncryption,
	goQueue,
	queueSize,
	inquiryEnabled,
	encryptionBanner,
	user
}) => (
	<>
		<Banner searching={searching} goEncryption={goEncryption} encryptionBanner={encryptionBanner} />
		<Banner searching={searching} sortBy={sortBy} toggleSort={toggleSort} isSort={true}/>
		<OmnichannelStatus searching={searching} goQueue={goQueue} inquiryEnabled={inquiryEnabled} queueSize={queueSize} user={user} />
	</>
));

ListHeader.propTypes = {
	searching: PropTypes.bool,
	sortBy: PropTypes.string,
	toggleSort: PropTypes.func,
	goEncryption: PropTypes.func,
	goQueue: PropTypes.func,
	queueSize: PropTypes.number,
	inquiryEnabled: PropTypes.bool,
	encryptionBanner: PropTypes.string,
	user: PropTypes.object
};

export default ListHeader;
