import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';

import styles from './styles';
import { Item } from './Item';
import Separator from '../../Separator';

export const HEADER_HEIGHT = 60;
export const Header = React.memo(({
	theme, setSelected, selected, reactions, baseUrl, getCustomEmoji
}) => (
	<View style={[styles.headerContainer, {height: HEADER_HEIGHT}]}>
		<FlatList
			data={reactions}
			showsHorizontalScrollIndicator={false}
			renderItem={({ item }) => <Item item={item} baseUrl={baseUrl} getCustomEmoji={getCustomEmoji} theme={theme} selected={selected} setSelected={setSelected} />}
			keyExtractor={item => item.emoji}
			horizontal
		/>
		<Separator theme={theme} style={styles.separator} />
	</View>
));

Header.propTypes = {
	theme: PropTypes.string,
  reactions: PropTypes.array,
  baseUrl: PropTypes.string,
  getCustomEmoji: PropTypes.func,
	setSelected: PropTypes.func,
	selected: PropTypes.object
};
