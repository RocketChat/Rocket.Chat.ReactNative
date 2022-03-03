import React, { useState } from 'react';
import { Keyboard, StyleSheet } from 'react-native';
import ShareExtension from 'rn-extensions-share';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import SearchBox from '../../../containers/SearchBox';
import * as HeaderButton from '../../../containers/HeaderButton';
import { themes } from '../../../constants/colors';
import sharedStyles from '../../Styles';
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
	};

	const onFocus = () => {
		initSearch();
	};

	return (
		<Animated.View
			entering={FadeIn.duration(200)}
			exiting={FadeOut.duration(200)}
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
		</Animated.View>
	);
});

export default Header;
