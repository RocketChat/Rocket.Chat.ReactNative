import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Keyboard, View, StyleSheet } from 'react-native';
import ShareExtension from 'rn-extensions-share';

import SearchBox from '../../../containers/SearchBox';
import { CancelModalButton } from '../../../containers/HeaderButton';
import { themes } from '../../../constants/colors';

import sharedStyles from '../../Styles';
import { animateNextTransition } from '../../../utils/layoutAnimation';

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		...sharedStyles.separatorBottom
	}
});

const Header = React.memo(({
	searching, onChangeSearchText, initSearch, cancelSearch, theme
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
		animateNextTransition();
	};

	const onFocus = () => {
		initSearch();
		animateNextTransition();
	};

	return (
		<View
			style={[
				styles.container,
				{
					borderColor: themes[theme].separatorColor,
					backgroundColor: themes[theme].headerBackground
				}
			]}
		>
			{
				!searching
					? (
						<CancelModalButton
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
	cancelSearch: PropTypes.func,
	theme: PropTypes.string
};

export default Header;
