import React, { ReactElement } from 'react';
import { FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, FadeOut, FadeOutDown } from 'react-native-reanimated';

import { useAutocompleteParams, useKeyboardHeight, useTrackingViewHeight } from '../../context';
import { AutocompleteItem } from './AutocompleteItem';
import { useAutocomplete } from '../../hooks';
import { IAutocompleteItemProps } from '../../interfaces';
import { AutocompletePreview } from './AutocompletePreview';
import { useRoomContext } from '../../../../views/RoomView/context';
import { useStyle } from './styles';

export const Autocomplete = ({ onPress }: { onPress: IAutocompleteItemProps['onPress'] }): ReactElement | null => {
	const { rid } = useRoomContext();
	const trackingViewHeight = useTrackingViewHeight();
	const keyboardHeight = useKeyboardHeight();
	const { bottom } = useSafeAreaInsets();
	const { text, type, params } = useAutocompleteParams();
	const items = useAutocomplete({
		rid,
		text,
		type,
		commandParams: params
	});
	const [styles, colors] = useStyle();
	const viewBottom = trackingViewHeight + keyboardHeight + (keyboardHeight > 0 ? 0 : bottom) - 4;

	if (items.length === 0 || !type) {
		return null;
	}

	if (type !== '/preview') {
		return (
			<Animated.View
				entering={FadeInDown}
				exiting={FadeOutDown}
				style={[
					styles.root,
					{
						bottom: viewBottom
					}
				]}>
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
			<Animated.View
				entering={FadeInUp}
				exiting={FadeOut}
				style={[styles.root, { backgroundColor: colors.surfaceLight, bottom: viewBottom }]}>
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
