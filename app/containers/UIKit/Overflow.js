import React, { useState } from 'react';
import { Text, FlatList, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import Popover from 'react-native-popover-view';

import { CustomIcon } from '../../lib/Icons';
import Touch from '../../utils/touch';
import Separator from '../Separator';
import ActivityIndicator from '../ActivityIndicator';

const keyExtractor = item => item.value;

const styles = StyleSheet.create({
	option: {
		padding: 8,
		minHeight: 32
	},
	loading: {
		padding: 0
	}
});

const Option = ({
	option: { text, value }, onOptionPress, parser, theme
}) => (
	<Touch
		onPress={() => onOptionPress({ value })}
		style={styles.option}
		theme={theme}
	>
		<Text>{parser.text(text)}</Text>
	</Touch>
);
Option.propTypes = {
	option: PropTypes.object,
	onOptionPress: PropTypes.func,
	parser: PropTypes.object,
	theme: PropTypes.string
};

const Options = ({
	options, onOptionPress, parser, theme
}) => (
	<FlatList
		data={options}
		renderItem={({ item }) => <Option option={item} onOptionPress={onOptionPress} parser={parser} theme={theme} />}
		keyExtractor={keyExtractor}
		ItemSeparatorComponent={() => <Separator theme={theme} />}
	/>
);
Options.propTypes = {
	options: PropTypes.array,
	onOptionPress: PropTypes.func,
	parser: PropTypes.object,
	theme: PropTypes.string
};

// it can has a weird behaviour on storybook
// but works fine on app
const touchable = {};

export const Overflow = ({
	element, loading, action, parser, theme
}) => {
	const { options, blockId } = element;
	const [show, onShow] = useState(false);

	const onOptionPress = ({ value }) => {
		onShow(false);
		action({ value });
	};

	return (
		<>
			<Touch
				ref={ref => touchable[blockId] = ref}
				onPress={() => onShow(!show)}
				theme={theme}
			>
				{!loading ? <CustomIcon size={18} name='menu' /> : <ActivityIndicator style={styles.loading} />}
			</Touch>
			<Popover
				isVisible={show}
				fromView={touchable[blockId]}
				onRequestClose={() => onShow(false)}
			>
				<Options options={options} onOptionPress={onOptionPress} parser={parser} theme={theme} />
			</Popover>
		</>
	);
};
Overflow.propTypes = {
	element: PropTypes.any,
	action: PropTypes.func,
	loading: PropTypes.bool,
	parser: PropTypes.object,
	theme: PropTypes.string
};
