import React from 'react';
import PropTypes from 'prop-types';

import SearchBar from './SearchBar';
import Directory from './Directory';
import Sort from './Sort';

const ListHeader = React.memo(({
	searching,
	sortBy,
	onChangeSearchText,
	toggleSort,
	goDirectory,
	inputRef,
	onCancelSearchPress,
	onSearchFocus
}) => (
	<>
		<SearchBar
			inputRef={inputRef}
			searching={searching}
			onChangeSearchText={onChangeSearchText}
			onCancelSearchPress={onCancelSearchPress}
			onSearchFocus={onSearchFocus}
		/>
		<Directory searching={searching} goDirectory={goDirectory} />
		<Sort searching={searching} sortBy={sortBy} toggleSort={toggleSort} />
	</>
));

ListHeader.propTypes = {
	searching: PropTypes.bool,
	sortBy: PropTypes.string,
	onChangeSearchText: PropTypes.func,
	toggleSort: PropTypes.func,
	goDirectory: PropTypes.func,
	inputRef: PropTypes.func,
	onCancelSearchPress: PropTypes.func,
	onSearchFocus: PropTypes.func
};

export default ListHeader;
