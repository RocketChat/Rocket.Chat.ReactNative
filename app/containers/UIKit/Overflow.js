import React, { useState } from 'react';
import { Text, FlatList, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import Popover from 'react-native-popover-view';

import { CustomIcon } from '../../lib/Icons';
import Touch from '../../utils/touch';
import Separator from '../Separator';

const keyExtractor = item => item.value;

const styles = StyleSheet.create({
	option: {
		padding: 8,
		minHeight: 32
	}
});

const Option = ({ option: { text, value }, onOptionPress, parser }) => (
	<Touch
		onPress={() => onOptionPress({ value })}
		style={styles.option}
		theme='light'
	>
		<Text>{parser.text(text)}</Text>
	</Touch>
);
Option.propTypes = {
	option: PropTypes.object,
	onOptionPress: PropTypes.func,
	parser: PropTypes.object
};

const Options = ({ options, onOptionPress, parser }) => (
	<FlatList
		data={options}
		renderItem={({ item }) => <Option option={item} onOptionPress={onOptionPress} parser={parser} />}
		keyExtractor={keyExtractor}
		ItemSeparatorComponent={() => <Separator theme='light' />}
	/>
);
Options.propTypes = {
	options: PropTypes.array,
	onOptionPress: PropTypes.func,
	parser: PropTypes.object
};

let touchable;

export const Overflow = ({ element, action, parser }) => {
	const { options } = element;
	const [show, onShow] = useState(false);

	const onOptionPress = ({ value }) => {
		onShow(false);
		action({ value });
	};

	return (
		<>
			<Touch
				ref={ref => touchable = ref}
				onPress={() => onShow(!show)}
				theme='light'
			>
				<CustomIcon size={18} name='menu' />
			</Touch>
			<Popover
				isVisible={show}
				fromView={touchable}
				onRequestClose={() => onShow(false)}
			>
				<Options options={options} onOptionPress={onOptionPress} parser={parser} />
			</Popover>
		</>
	);
};
Overflow.propTypes = {
	element: PropTypes.any,
	action: PropTypes.func,
	parser: PropTypes.object
};
