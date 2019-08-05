import React from 'react';
import PropTypes from 'prop-types';

import SearchBox from '../../../containers/SearchBox';

const SearchBar = React.memo(({ onChangeSearchText, onCancelPress, showSearch }) => {
	if (showSearch) {
		return (
			<SearchBox
				onChangeText={onChangeSearchText}
				testID='rooms-list-view-search'
				key='rooms-list-view-search'
				hasCancel
				onCancelPress={onCancelPress}
			/>
		);
	}

	return null;
});

SearchBar.propTypes = {
	onChangeSearchText: PropTypes.func,
	onCancelPress: PropTypes.func,
	showSearch: PropTypes.bool
};

export default SearchBar;
