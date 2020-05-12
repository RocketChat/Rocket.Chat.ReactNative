import React from 'react';
import PropTypes from 'prop-types';
import { Text, FlatList, TouchableOpacity } from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';

import Separator from '../Separator';

import { themes } from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';
import styles from './styles';
import { isAndroid } from '../../utils/deviceInfo';

// For some reason react-native-gesture-handler isn't working on bottom sheet (iOS)
const Button = isAndroid ? BorderlessButton : TouchableOpacity;

const Item = React.memo(({
	item, onPress, theme
}) => (
	<Button onPress={onPress} style={[styles.item, { backgroundColor: themes[theme].backgroundColor }]}>
		<CustomIcon name={item.icon} size={20} color={item.danger ? themes[theme].dangerColor : themes[theme].bodyText} />
		<Text
			numberOfLines={1}
			style={[styles.title, { color: item.danger ? themes[theme].dangerColor : themes[theme].bodyText }]}
		>
			{item.title}
		</Text>
	</Button>
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
	/>
));
Content.propTypes = {
	options: PropTypes.array,
	onPress: PropTypes.func,
	theme: PropTypes.string
};
export default Content;
