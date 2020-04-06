import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import ListItem from './ListItem';
import Check from './Check';
import Separator from './Separator';

const styles = StyleSheet.create({
	check: {
		marginHorizontal: 0
	}
});

const Item = React.memo(({
	item,
	selected,
	onItemPress,
	theme
}) => (
	<ListItem
		title={item.label}
		right={selected && (() => <Check theme={theme} style={styles.check} />)}
		onPress={onItemPress}
		theme={theme}
	/>
));
Item.propTypes = {
	item: PropTypes.object,
	selected: PropTypes.bool,
	onItemPress: PropTypes.func,
	theme: PropTypes.string
};

const Picker = React.memo(({
	data,
	value = data[0].value,
	onChangeValue,
	theme
}) => (
	<FlatList
		data={data}
		keyExtractor={item => item.value}
		renderItem={({ item }) => (
			<>
				<Item
					item={item}
					theme={theme}
					selected={value === item.value}
					onItemPress={() => onChangeValue(item.value)}
				/>
			</>
		)}
		ItemSeparatorComponent={() => <Separator theme={theme} />}
	/>
));
Picker.propTypes = {
	data: PropTypes.array,
	value: PropTypes.string,
	onChangeValue: PropTypes.func,
	theme: PropTypes.string
};

export default Picker;
