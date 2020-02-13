import React from 'react';
import PropTypes from 'prop-types';

import SearchBar from './SearchBar';
import Directory from './Directory';
import Sort from './Sort';

const ListHeader = React.memo(({
	searching, sortBy, onChangeSearchText, toggleSort, goDirectory, inputRef
}) => (
	<>
		<SearchBar onChangeSearchText={onChangeSearchText} inputRef={inputRef} />
		<Directory searching={searching} goDirectory={goDirectory} />
		<Sort searching={searching} sortBy={sortBy} toggleSort={toggleSort} />
	</>
));

ListHeader.propTypes = {
	searching: PropTypes.number,
	sortBy: PropTypes.string,
	onChangeSearchText: PropTypes.func,
	toggleSort: PropTypes.func,
	goDirectory: PropTypes.func,
	inputRef: PropTypes.func
};

export default ListHeader;
