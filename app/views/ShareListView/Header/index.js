import React from 'react';
import PropTypes from 'prop-types';

import Header from './Header';

const ShareListHeader = React.memo(({
	searching, initSearch, cancelSearch, search, theme
}) => {
	const onSearchChangeText = (text) => {
		search(text.trim());
	};

	return (
		<Header
			theme={theme}
			searching={searching}
			initSearch={initSearch}
			cancelSearch={cancelSearch}
			onChangeSearchText={onSearchChangeText}
		/>
	);
});

ShareListHeader.propTypes = {
	searching: PropTypes.bool,
	initSearch: PropTypes.func,
	cancelSearch: PropTypes.func,
	search: PropTypes.func,
	theme: PropTypes.string
};

export default ShareListHeader;
