import React from 'react';
import PropTypes from 'prop-types';

import SearchBox from '../../../containers/SearchBox';
import { isIOS } from '../../../utils/deviceInfo';
import { withTheme } from '../../../theme';

const SearchBar = React.memo(({ theme, onChangeSearchText }) => {
	if (isIOS) {
		return (
			<SearchBox
				onChangeText={onChangeSearchText}
				testID='rooms-list-view-search'
				theme={theme}
			/>
		);
	}
	return null;
});

SearchBar.propTypes = {
	onChangeSearchText: PropTypes.func
};

export default withTheme(SearchBar);
