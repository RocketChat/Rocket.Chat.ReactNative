import React, { ReactElement } from 'react';
import { FlatList, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAutocompleteParams } from '../../context';
import { AutocompleteItem } from './AutocompleteItem';
import { useAutocomplete } from '../../hooks';
import { IAutocompleteItemProps } from '../../interfaces';
import { AutocompletePreview } from './AutocompletePreview';
import { useRoomContext } from '../../../../views/RoomView/context';
import { useStyle } from './styles';

export const Autocomplete = ({
	onPress,
	style,
	accessibilityFocusOnInput
}: {
	onPress: IAutocompleteItemProps['onPress'];
	style: ViewStyle;
	accessibilityFocusOnInput: () => void;
}): ReactElement | null => {
	const { rid, updateAutocompleteVisible } = useRoomContext();
	const { text, type, params } = useAutocompleteParams();
	const items = useAutocomplete({
		rid,
		text,
		type,
		updateAutocompleteVisible,
		accessibilityFocusOnInput,
		commandParams: params
	});
	const [styles, colors] = useStyle();
	let { left, right } = useSafeAreaInsets();
	if (left === 0) {
		left = 8;
	}
	if (right === 0) {
		right = 8;
	}

	if (items.length === 0 || !type) {
		return null;
	}

	if (type !== '/preview') {
		return (
			<Animated.View style={[styles.root, { right, left }, style]}>
				<FlatList
					contentContainerStyle={styles.listContentContainer}
					data={items}
					renderItem={({ item }) => <AutocompleteItem item={item} onPress={onPress} />}
					keyboardShouldPersistTaps='always'
					testID='autocomplete'
				/>
			</Animated.View>
		);
	}

	if (type === '/preview') {
		return (
			<Animated.View style={[styles.root, { backgroundColor: colors.surfaceLight, right, left }, style]}>
				<FlatList
					contentContainerStyle={styles.listContentContainer}
					style={styles.list}
					horizontal
					data={items}
					renderItem={({ item }) => <AutocompletePreview item={item} onPress={onPress} />}
					keyboardShouldPersistTaps='always'
					testID='autocomplete'
				/>
			</Animated.View>
		);
	}

	return null;
};
