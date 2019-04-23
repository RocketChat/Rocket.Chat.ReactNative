import React from 'react';
import PropTypes from 'prop-types';

import SearchBar from './SearchBar';
import Sort from './Sort';

const ListHeader = React.memo(({
	searchLength, sortBy, onChangeSearchText, toggleSort
}) => (
	<React.Fragment>
		<SearchBar onChangeSearchText={onChangeSearchText} />
		<Sort searchLength={searchLength} sortBy={sortBy} toggleSort={toggleSort} />
	</React.Fragment>
));

ListHeader.propTypes = {
	searchLength: PropTypes.number,
	sortBy: PropTypes.string,
	onChangeSearchText: PropTypes.func,
	toggleSort: PropTypes.func
};

export default ListHeader;
