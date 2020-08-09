import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';

import styles from './styles';
import { Item } from './Item';

export const HEADER_HEIGHT = 50;
export const Header = React.memo(({
	theme, reactions, baseUrl, getCustomEmoji, selected, setSelected
}) => (
	<View style={[styles.headerContainer, { height: HEADER_HEIGHT }]}>
		<FlatList
			data={reactions}
			showsHorizontalScrollIndicator={false}
			renderItem={({ item }) => <Item item={item} baseUrl={baseUrl} getCustomEmoji={getCustomEmoji} theme={theme} selected={selected} setSelected={setSelected} />}
			keyExtractor={item => item.emoji}
			horizontal
		/>
	</View>
));

Header.propTypes = {
	theme: PropTypes.string,
	reactions: PropTypes.array,
	baseUrl: PropTypes.string,
	getCustomEmoji: PropTypes.func,
	selected: PropTypes.object,
	setSelected: PropTypes.func
};
