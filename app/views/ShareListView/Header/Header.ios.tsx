import React, { useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import ShareExtension from 'rn-extensions-share';

import SearchBox from './SearchBox';
import * as HeaderButton from '../../../containers/HeaderButton';
import { themes } from '../../../lib/constants';
import sharedStyles from '../../Styles';
import { animateNextTransition } from '../../../lib/methods/helpers/layoutAnimation';
import { IShareListHeaderIos } from './interface';

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		...sharedStyles.separatorBottom
	}
});

const Header = React.memo(({ searching, onChangeSearchText, initSearch, cancelSearch, theme }: IShareListHeaderIos) => {
	const [text, setText] = useState('');

	const onChangeText = (searchText: string) => {
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
			]}>
			{!searching ? <HeaderButton.CancelModal onPress={ShareExtension.close} testID='share-extension-close' /> : null}
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

export default Header;
