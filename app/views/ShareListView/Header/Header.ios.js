import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
	Keyboard, LayoutAnimation, View, StyleSheet
} from 'react-native';
import ShareExtension from 'rn-extensions-share';

import SearchBox from '../../../containers/SearchBox';
import { CloseShareExtensionButton } from '../../../containers/HeaderButton';
import { HEADER_BACKGROUND } from '../../../constants/colors';

import sharedStyles from '../../Styles';

const styles = StyleSheet.create({
	container: {
		backgroundColor: HEADER_BACKGROUND,
		flexDirection: 'row',
		...sharedStyles.separatorBottom
	}
});

const Header = React.memo(({
	searching, onChangeSearchText, initSearch, cancelSearch
}) => {
	const [text, setText] = useState('');

	const onChangeText = (searchText) => {
		onChangeSearchText(searchText);
		setText(searchText);
	};

	const onCancelPress = () => {
		Keyboard.dismiss();
		onChangeText('');
		cancelSearch();
		LayoutAnimation.easeInEaseOut();
	};

	const onFocus = () => {
		initSearch();
		LayoutAnimation.easeInEaseOut();
	};

	return (
		<View style={styles.container}>
			{
				!searching
					? (
						<CloseShareExtensionButton
							onPress={ShareExtension.close}
							testID='share-extension-close'
						/>
					)
					: null
			}
			<SearchBox
				value={text}
				hasCancel={searching}
				onFocus={onFocus}
				onCancelPress={onCancelPress}
				onChangeText={onChangeText}
				testID='rooms-list-view-search'
				key='rooms-list-view-search'
			/>
		</View>
	);
});

Header.propTypes = {
	searching: PropTypes.bool,
	onChangeSearchText: PropTypes.func,
	initSearch: PropTypes.func,
	cancelSearch: PropTypes.func
};

export default Header;
