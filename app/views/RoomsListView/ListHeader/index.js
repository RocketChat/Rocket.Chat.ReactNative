import React from 'react';
import PropTypes from 'prop-types';

import SearchBar from './SearchBar';
import Directory from './Directory';
import Sort from './Sort';

const ListHeader = React.memo(({
	searchLength, sortBy, onChangeSearchText, toggleSort, goDirectory
}) => (
	<React.Fragment>
		<SearchBar onChangeSearchText={onChangeSearchText} />
		<Directory goDirectory={goDirectory} />
		<Sort searchLength={searchLength} sortBy={sortBy} toggleSort={toggleSort} />
	</React.Fragment>
));

ListHeader.propTypes = {
	searchLength: PropTypes.number,
	sortBy: PropTypes.string,
	onChangeSearchText: PropTypes.func,
	toggleSort: PropTypes.func,
	goDirectory: PropTypes.func
};

export default ListHeader;
