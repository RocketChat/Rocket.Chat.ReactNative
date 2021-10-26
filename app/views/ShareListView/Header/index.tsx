import React from 'react';

// @ts-ignore
// eslint-disable-next-line import/extensions,import/no-unresolved
import Header from './Header';

interface IShareListHeader {
	searching: boolean;
	initSearch?: () => void;
	cancelSearch?: () => void;
	search(text: string): void;
	theme: string;
}

const ShareListHeader = React.memo(({ searching, initSearch, cancelSearch, search, theme }: IShareListHeader) => {
	const onSearchChangeText = (text: string) => {
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

export default ShareListHeader;
