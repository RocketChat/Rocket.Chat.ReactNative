import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
	Keyboard, LayoutAnimation, View, StyleSheet
} from 'react-native';
import ShareExtension from 'rn-extensions-share';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';

import SearchBox from '../../containers/SearchBox';
import { isIOS, isNotch } from '../../utils/deviceInfo';
import { CloseShareExtensionButton } from '../../containers/HeaderButton';
import { HEADER_BACKGROUND } from '../../constants/colors';

import sharedStyles from '../Styles';

const styles = StyleSheet.create({
	container: {
		backgroundColor: HEADER_BACKGROUND,
		width: '100%',
		flexDirection: 'row',
		paddingTop: getStatusBarHeight() + (isNotch ? 20 : 0),
		...sharedStyles.separatorBottom
	}
});

const SearchHeader = React.memo(({ onChangeSearchText }) => {
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
		if (isIOS) {
			LayoutAnimation.easeInEaseOut();
		}
	};

	const onFocus = () => {
		setHasCancel(true);
		if (isIOS) {
			LayoutAnimation.easeInEaseOut();
		}
	};

	if (isIOS) {
		return (
			<View style={styles.container}>
				{
					!hasCancel
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
					hasCancel={hasCancel}
					onFocus={onFocus}
					onCancelPress={onCancelPress}
					onChangeText={onChangeText}
					testID='rooms-list-view-search'
					key='rooms-list-view-search'
				/>
			</View>
		);
	}
	return null;
});

SearchHeader.propTypes = {
	onChangeSearchText: PropTypes.func
};

export default SearchHeader;
