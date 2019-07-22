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
		width: '100%',
		flexDirection: 'row',
		...sharedStyles.separatorBottom
	}
});

const Header = React.memo(({ onChangeSearchText }) => {
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
		LayoutAnimation.easeInEaseOut();
	};

	const onFocus = () => {
		setHasCancel(true);
		LayoutAnimation.easeInEaseOut();
	};

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
});

Header.propTypes = {
	onChangeSearchText: PropTypes.func
};

export default Header;
