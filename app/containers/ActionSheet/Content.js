import React from 'react';
import PropTypes from 'prop-types';
import { Text, FlatList } from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';

import Separator from '../Separator';

import { themes } from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';
import styles from './styles';

const Item = React.memo(({
	item, onPress, theme
}) => (
	<BorderlessButton onPress={onPress} style={[styles.item, { backgroundColor: themes[theme].backgroundColor }]}>
		<CustomIcon name={item.icon} size={20} color={item.danger ? themes[theme].dangerColor : themes[theme].bodyText} />
		<Text
			numberOfLines={1}
			style={[styles.title, { color: item.danger ? themes[theme].dangerColor : themes[theme].bodyText }]}
		>
			{item.title}
		</Text>
	</BorderlessButton>
));
Item.propTypes = {
	item: PropTypes.shape({
		title: PropTypes.string,
		icon: PropTypes.string,
		danger: PropTypes.bool
	}),
	onPress: PropTypes.func,
	theme: PropTypes.string
};

const Content = React.memo(({ options, onPress, theme }) => (
	<FlatList
		data={options}
		renderItem={({ item, index }) => <Item item={item} onPress={() => onPress(index)} theme={theme} />}
		style={{ backgroundColor: themes[theme].backgroundColor }}
		contentContainerStyle={styles.content}
		ListHeaderComponent={() => <Separator theme={theme} />}
		ItemSeparatorComponent={() => <Separator theme={theme} />}
		scrollEnabled={false}
	/>
));
Content.propTypes = {
	options: PropTypes.array,
	onPress: PropTypes.func,
	theme: PropTypes.string
};
export default Content;
