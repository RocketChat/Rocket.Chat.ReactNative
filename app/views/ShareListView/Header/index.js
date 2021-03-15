import React from 'react';
import PropTypes from 'prop-types';

import Header from '../../../presentation/Header';

const ShareListHeader = React.memo(({
	searching, search, theme
}) => {
	const onSearchChangeText = (text) => {
		search(text.trim());
	};

	return (
		<Header
			theme={theme}
			searching={searching}
			onChangeSearchText={onSearchChangeText}
			testID='share-list-view-search-input'
		/>
	);
});

ShareListHeader.propTypes = {
	searching: PropTypes.bool,
	search: PropTypes.func,
	theme: PropTypes.string
};

export default ShareListHeader;
