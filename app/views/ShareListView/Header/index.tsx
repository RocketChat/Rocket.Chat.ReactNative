import React from 'react';

import Header from './Header';
import { IShareListHeader } from './interface';

const ShareListHeader = React.memo(({ searching, initSearch, cancelSearch, onChangeSearchText, theme }: IShareListHeader) => {
	const onSearchChangeText = (text: string) => {
		onChangeSearchText(text.trim());
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

export default ShareListHeader;
