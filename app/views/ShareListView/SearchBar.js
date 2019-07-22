import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Keyboard, LayoutAnimation } from 'react-native';

import SearchBox from '../../containers/SearchBox';
import { isIOS } from '../../utils/deviceInfo';

const SearchBar = React.memo(({ onChangeSearchText }) => {
	const [text, setText] = useState('');
	const [hasCancel, setHasCancel] = useState(false);

	const onChangeText = (searchText) => {
		onChangeSearchText(searchText);
		setText(searchText);
	};

	const onCancelPress = () => {
		Keyboard.dismiss();
		onChangeText('');
		setHasCancel(false);
	};

	const onFocus = () => {
		setHasCancel(true);
		if (isIOS) {
			LayoutAnimation.easeInEaseOut();
		}
	};

	if (isIOS) {
		return (
			<SearchBox
				value={text}
				hasCancel={hasCancel}
				onFocus={onFocus}
				onCancelPress={onCancelPress}
				onChangeText={onChangeText}
				testID='rooms-list-view-search'
				key='rooms-list-view-search'
			/>
		);
	}
	return null;
});

SearchBar.propTypes = {
	onChangeSearchText: PropTypes.func
};

export default SearchBar;
