import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';

import styles from './styles';
import { ReactionItem } from './ReactionItem';
import Separator from '../Separator';

export const Header = React.memo(({
	theme, data, setSelected, selected
}) => (
	<View style={styles.headerContainer}>
		<FlatList
			data={data.reactions}
			showsHorizontalScrollIndicator={false}
			renderItem={({ item }) => <ReactionItem item={item} baseUrl={data.baseUrl} getCustomEmoji={data.getCustomEmoji} theme={theme} setSelected={setSelected} selected={selected} />}
			keyExtractor={item => item.emoji}
			horizontal
		/>
		<Separator theme={theme} style={styles.separator} />
	</View>
));

Header.propTypes = {
	theme: PropTypes.string,
	data: PropTypes.shape({
		reactions: PropTypes.array,
		baseUrl: PropTypes.string,
		getCustomEmoji: PropTypes.func,
		setSelected: PropTypes.func,
		selected: PropTypes.object
	}),
	selected: PropTypes.object,
	setSelected: PropTypes.func
};
