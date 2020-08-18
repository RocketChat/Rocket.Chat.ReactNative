import React from 'react';
import PropTypes from 'prop-types';

import Encryption from './Encryption';
import Directory from './Directory';
import Sort from './Sort';
import Queue from './Queue';

const ListHeader = React.memo(({
	searching,
	sortBy,
	toggleSort,
	goDirectory,
	goEncryption,
	goQueue,
	queueSize,
	inquiryEnabled,
	showEncryption
}) => (
	<>
		<Encryption searching={searching} goEncryption={goEncryption} showEncryption={showEncryption} />
		<Directory searching={searching} goDirectory={goDirectory} />
		<Sort searching={searching} sortBy={sortBy} toggleSort={toggleSort} />
		<Queue searching={searching} goQueue={goQueue} queueSize={queueSize} inquiryEnabled={inquiryEnabled} />
	</>
));

ListHeader.propTypes = {
	searching: PropTypes.bool,
	sortBy: PropTypes.string,
	toggleSort: PropTypes.func,
	goDirectory: PropTypes.func,
	goEncryption: PropTypes.func,
	goQueue: PropTypes.func,
	queueSize: PropTypes.number,
	inquiryEnabled: PropTypes.bool,
	showEncryption: PropTypes.bool
};

export default ListHeader;
