import React from 'react';
import PropTypes from 'prop-types';

import SearchBox from '../../../containers/SearchBox';
import { isIOS } from '../../../utils/deviceInfo';

const SearchBar = React.memo(({ onChangeSearchText }) => {
	if (isIOS) {
		return <SearchBox onChangeText={onChangeSearchText} testID='rooms-list-view-search' key='rooms-list-view-search' />;
	}
	return null;
});

SearchBar.propTypes = {
	onChangeSearchText: PropTypes.func
};

export default SearchBar;
