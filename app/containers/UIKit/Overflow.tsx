import React, { useState } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import Popover from 'react-native-popover-view';
import Touchable from 'react-native-platform-touchable';

import { CustomIcon } from '../../lib/Icons';
import ActivityIndicator from '../ActivityIndicator';
import { themes } from '../../constants/colors';
import { BUTTON_HIT_SLOP } from '../message/utils';
import * as List from '../List';

interface IOption {
	option: {
		text: string;
		value: string;
	};
	onOptionPress: Function;
	parser: any;
	theme: string;
}

interface IOptions {
	options: [];
	onOptionPress: Function;
	parser: object;
	theme: string;
}

interface IOverflow {
	element: any;
	action: Function;
	loading: boolean;
	parser: object;
	theme: string;
	context: any;
}

const keyExtractor = (item: any) => item.value;

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

const Option = ({ option: { text, value }, onOptionPress, parser, theme }: IOption) => (
	<Touchable
		onPress={() => onOptionPress({ value })}
		background={Touchable.Ripple(themes[theme].bannerBackground)}
		style={styles.option}>
		<Text>{parser.text(text)}</Text>
	</Touchable>
);

const Options = ({ options, onOptionPress, parser, theme }: IOptions) => (
	<FlatList
		data={options}
		renderItem={({ item }) => <Option option={item} onOptionPress={onOptionPress} parser={parser} theme={theme} />}
		keyExtractor={keyExtractor}
		ItemSeparatorComponent={List.Separator}
	/>
);

const touchable = {};

export const Overflow = ({ element, loading, action, parser, theme }: IOverflow) => {
	const { options, blockId } = element;
	const [show, onShow] = useState(false);

	const onOptionPress = ({ value }: any) => {
		onShow(false);
		action({ value });
	};

	return (
		<>
			<Touchable
				/* @ts-ignore*/
				ref={ref => (touchable[blockId] = ref)}
				background={Touchable.Ripple(themes[theme].bannerBackground)}
				onPress={() => onShow(!show)}
				hitSlop={BUTTON_HIT_SLOP}
				style={styles.menu}>
				{!loading ? (
					<CustomIcon size={18} name='kebab' color={themes[theme].bodyText} />
				) : (
					<ActivityIndicator style={styles.loading} theme={theme} />
				)}
			</Touchable>
			<Popover
				isVisible={show}
				/* @ts-ignore*/
				fromView={touchable[blockId]}
				onRequestClose={() => onShow(false)}>
				<Options options={options} onOptionPress={onOptionPress} parser={parser} theme={theme} />
			</Popover>
		</>
	);
};
