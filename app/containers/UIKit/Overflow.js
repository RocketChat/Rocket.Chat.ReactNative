import React, { useState } from 'react';
import { Text, FlatList, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import Popover from 'react-native-popover-view';
import Touchable from 'react-native-platform-touchable';

import { CustomIcon } from '../../lib/Icons';
import Separator from '../Separator';
import ActivityIndicator from '../ActivityIndicator';
import { themes } from '../../constants/colors';
import { BUTTON_HIT_SLOP } from '../message/utils';

const keyExtractor = item => item.value;

const styles = StyleSheet.create({
	menu: {
		justifyContent: 'center'
	},
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
	<Touchable
		onPress={() => onOptionPress({ value })}
		background={Touchable.Ripple(themes[theme].bannerBackground)}
		style={styles.option}
	>
		<Text>{parser.text(text)}</Text>
	</Touchable>
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
			<Touchable
				ref={ref => touchable[blockId] = ref}
				background={Touchable.Ripple(themes[theme].bannerBackground)}
				onPress={() => onShow(!show)}
				hitSlop={BUTTON_HIT_SLOP}
				style={styles.menu}
			>
				{!loading ? <CustomIcon size={18} name='menu' color={themes[theme].bodyText} /> : <ActivityIndicator style={styles.loading} theme={theme} />}
			</Touchable>
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
