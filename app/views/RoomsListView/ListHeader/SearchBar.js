import React from 'react';
import PropTypes from 'prop-types';

import SearchBox from '../../../containers/SearchBox';
import { isIOS } from '../../../utils/deviceInfo';

const SearchBar = React.memo(({ onChangeSearchText, hasCancel, onCancelPress }) => {
	if (isIOS) {
		return (
			<SearchBox
				hasCancel={hasCancel}
				onCancelPress={onCancelPress}
				onChangeText={onChangeSearchText}
				testID='rooms-list-view-search'
				key='rooms-list-view-search'
			/>
		);
	}
	return null;
});

SearchBar.propTypes = {
	onChangeSearchText: PropTypes.func,
	onCancelPress: PropTypes.func,
	hasCancel: PropTypes.bool
};

export default SearchBar;
