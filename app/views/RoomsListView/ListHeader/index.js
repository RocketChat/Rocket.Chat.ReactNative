import React from 'react';
import PropTypes from 'prop-types';

import Directory from './Directory';
import Sort from './Sort';

const ListHeader = React.memo(({
	searching,
	sortBy,
	toggleSort,
	goDirectory,
	permissions
}) => (
	<>
		<Directory searching={searching} goDirectory={goDirectory} permissions={permissions} />
		<Sort searching={searching} sortBy={sortBy} toggleSort={toggleSort} />
	</>
));

ListHeader.propTypes = {
	searching: PropTypes.bool,
	sortBy: PropTypes.string,
	toggleSort: PropTypes.func,
	goDirectory: PropTypes.func,
	permissions: PropTypes.object
};

export default ListHeader;
