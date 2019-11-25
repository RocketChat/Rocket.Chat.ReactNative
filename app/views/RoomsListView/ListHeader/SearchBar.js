import React from 'react';
import PropTypes from 'prop-types';

import SearchBox from '../../../containers/SearchBox';
import { isIOS } from '../../../utils/deviceInfo';

const SearchBar = React.memo(({ onChangeSearchText, inputRef }) => {
	if (isIOS) {
		return <SearchBox onChangeText={onChangeSearchText} inputRef={inputRef} testID='rooms-list-view-search' key='rooms-list-view-search' />;
	}
	return null;
});

SearchBar.propTypes = {
	inputRef: PropTypes.func,
	onChangeSearchText: PropTypes.func
};

export default SearchBar;
