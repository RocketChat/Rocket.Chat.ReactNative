import React from 'react';
import PropTypes from 'prop-types';

import Sort from './Sort';

const ListHeader = React.memo(({
	searching,
	sortBy,
	toggleSort
}) => (
	<Sort searching={searching} sortBy={sortBy} toggleSort={toggleSort} />
));

ListHeader.propTypes = {
	searching: PropTypes.bool,
	sortBy: PropTypes.string,
	toggleSort: PropTypes.func
};

export default ListHeader;
