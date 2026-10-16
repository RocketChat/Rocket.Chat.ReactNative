import { useRef, useState, type RefObject } from 'react';
import { FlatList, StyleSheet, Text, type View } from 'react-native';
import Popover from 'react-native-popover-view';

import { CustomIcon } from '../CustomIcon';
import ActivityIndicator from '../ActivityIndicator';
import { themes } from '~/lib/constants/colors';
import { useTheme } from '~/theme';
import openLink from '~/lib/methods/helpers/openLink';
import { BUTTON_HIT_SLOP } from '../message/utils';
import * as List from '../List';
import { isSafeUrl } from './isSafeUrl';
import { type IOption, type IOptions, type IOverflow, type Option } from './interfaces';
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

const Option = ({ option: { text, value, url }, onOptionPress, parser }: IOption) => (
	<Touch onPress={() => onOptionPress({ value, url })} style={styles.option}>
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

export const Overflow = ({ element, loading, action, parser }: IOverflow) => {
	const { theme } = useTheme();
	const options = element?.options || [];
	const [show, onShow] = useState(false);

	const touchableRef = useRef<View>(null) as RefObject<View>;

	const onOptionPress = ({ value, url }: { value: Option['value']; url?: Option['url'] }) => {
		onShow(false);
		action({ value });
		if (url && isSafeUrl(url)) {
			openLink(url, theme);
		}
	};

	return (
		<>
			<Touch ref={touchableRef} onPress={() => onShow(!show)} hitSlop={BUTTON_HIT_SLOP} style={styles.menu}>
				{!loading ? (
					<CustomIcon size={18} name='kebab' color={themes[theme].fontDefault} />
				) : (
					<ActivityIndicator style={styles.loading} />
				)}
			</Touch>
			<Popover isVisible={show} from={touchableRef} onRequestClose={() => onShow(false)}>
				<Options options={options} onOptionPress={onOptionPress} parser={parser} theme={theme} />
			</Popover>
		</>
	);
};
