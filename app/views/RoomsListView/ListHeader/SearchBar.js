import React from 'react';
import PropTypes from 'prop-types';
import { ViewPropTypes } from 'react-native';

import SearchBox from '../../../containers/SearchBox';
import { isIOS } from '../../../utils/deviceInfo';

const SearchBar = React.memo(({
	onChangeSearchText, hasCancel, onCancelPress, propsStyles
}) => {
	if (isIOS) {
		return (
			<SearchBox
				propsStyles={propsStyles}
				onChangeText={onChangeSearchText}
				hasCancel={hasCancel}
				onCancelPress={onCancelPress}
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
	hasCancel: PropTypes.bool,
	propsStyles: PropTypes.shape({
		cancel: ViewPropTypes.style
	})
};

export default SearchBar;
