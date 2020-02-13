import React from 'react';
import PropTypes from 'prop-types';

import SearchBox from '../../../containers/SearchBox';
import { isIOS } from '../../../utils/deviceInfo';
import { withTheme } from '../../../theme';

const SearchBar = React.memo(({
	theme, onChangeSearchText, inputRef, searching, onCancelSearchPress, onSearchFocus
}) => {
	if (isIOS) {
		return (
			<SearchBox
				onChangeText={onChangeSearchText}
				testID='rooms-list-view-search'
				inputRef={inputRef}
				theme={theme}
				hasCancel={searching}
				onCancelPress={onCancelSearchPress}
				onFocus={onSearchFocus}
			/>
		);
	}
	return null;
});

SearchBar.propTypes = {
	theme: PropTypes.string,
	inputRef: PropTypes.func,
	onChangeSearchText: PropTypes.func
};

export default withTheme(SearchBar);
