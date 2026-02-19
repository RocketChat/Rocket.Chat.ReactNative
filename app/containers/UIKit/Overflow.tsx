import React, { useState } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import Popover from 'react-native-popover-view';

import { CustomIcon } from '../CustomIcon';
import ActivityIndicator from '../ActivityIndicator';
import { themes } from '../../lib/constants/colors';
import { useTheme } from '../../theme';
import { BUTTON_HIT_SLOP } from '../message/utils';
import * as List from '../List';
import { type IOption, type IOptions, type IOverflow } from './interfaces';
import Touch from '../Touch';

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

const Option = ({ option: { text, value }, onOptionPress, parser }: IOption) => (
	<Touch
		onPress={() => onOptionPress({ value })}
		style={styles.option}>
		<Text>{parser.text(text)}</Text>
	</Touch>
);

const Options = ({ options, onOptionPress, parser, theme }: IOptions) => (
	<FlatList
		data={options}
		renderItem={({ item }) => <Option option={item} onOptionPress={onOptionPress} parser={parser} theme={theme} />}
		keyExtractor={keyExtractor}
		ItemSeparatorComponent={List.Separator}
	/>
);

const touchable: { [key: string]: React.RefObject<any> | null } = {};

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
			<Touch
				ref={ref => {
					touchable[blockId] = ref;
				}}
				onPress={() => onShow(!show)}
				hitSlop={BUTTON_HIT_SLOP}
				style={styles.menu}>
				{!loading ? (
					<CustomIcon size={18} name='kebab' color={themes[theme].fontDefault} />
				) : (
					<ActivityIndicator style={styles.loading} />
				)}
			</Touch>
			<Popover
				isVisible={show}
				from={touchable[blockId]}
				onRequestClose={() => onShow(false)}>
				<Options options={options} onOptionPress={onOptionPress} parser={parser} theme={theme} />
			</Popover>
		</>
	);
};
