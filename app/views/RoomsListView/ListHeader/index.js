import React from 'react';
import PropTypes from 'prop-types';

import Queue from './Queue';
import Directory from './Directory';
import Sort from './Sort';

const ListHeader = React.memo(({
	searching,
	sortBy,
	toggleSort,
	goDirectory,
	goQueue
}) => (
	<>
		<Directory searching={searching} goDirectory={goDirectory} />
		<Sort searching={searching} sortBy={sortBy} toggleSort={toggleSort} />
		<Queue searching={searching} goQueue={goQueue} />
	</>
));

ListHeader.propTypes = {
	searching: PropTypes.bool,
	sortBy: PropTypes.string,
	toggleSort: PropTypes.func,
	goDirectory: PropTypes.func,
	goQueue: PropTypes.func
};

export default ListHeader;
