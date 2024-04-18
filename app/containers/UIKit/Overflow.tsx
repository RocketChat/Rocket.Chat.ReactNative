import React, { useState } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import Popover from 'react-native-popover-view';
import Touchable from 'react-native-platform-touchable';

import { CustomIcon } from '../CustomIcon';
import ActivityIndicator from '../ActivityIndicator';
import { themes } from '../../lib/constants';
import { useTheme } from '../../theme';
import { BUTTON_HIT_SLOP } from '../message/utils';
import * as List from '../List';
import { IOption, IOptions, IOverflow } from './interfaces';

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
		background={Touchable.Ripple(themes[theme].surfaceNeutral)}
		style={styles.option}
	>
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

const touchable: { [key: string]: Touchable | null } = {};

export const Overflow = ({ element, loading, action, parser }: IOverflow) => {
	const { theme } = useTheme();
	const options = element?.options || [];
	const blockId = element?.blockId || '';
	const [show, onShow] = useState(false);

	const onOptionPress = ({ value }: any) => {
		onShow(false);
		action({ value });
	};

	return (
		<>
			<Touchable
				ref={ref => (touchable[blockId] = ref)}
				background={Touchable.Ripple(themes[theme].surfaceNeutral)}
				onPress={() => onShow(!show)}
				hitSlop={BUTTON_HIT_SLOP}
				style={styles.menu}
			>
				{!loading ? (
					<CustomIcon size={18} name='kebab' color={themes[theme].fontDefault} />
				) : (
					<ActivityIndicator style={styles.loading} />
				)}
			</Touchable>
			<Popover
				isVisible={show}
				// fromView exists in Popover Component
				/* @ts-ignore*/
				fromView={touchable[blockId]}
				onRequestClose={() => onShow(false)}
			>
				<Options options={options} onOptionPress={onOptionPress} parser={parser} theme={theme} />
			</Popover>
		</>
	);
};
