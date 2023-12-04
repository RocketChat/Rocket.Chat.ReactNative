import React, { ReactElement } from 'react';
import { View, FlatList } from 'react-native';

import { useAutocompleteParams, useKeyboardHeight, useTrackingViewHeight } from '../../context';
import { AutocompleteItem } from './AutocompleteItem';
import { useAutocomplete } from '../../hooks';
import { useTheme } from '../../../../theme';
import { IAutocompleteItemProps } from '../../interfaces';
import { AutocompletePreview } from './AutocompletePreview';
import { useRoomContext } from '../../../../views/RoomView/context';

/**
 * TODO: Come up with a better way to calculate both of these values.
 * Maybe from KeyboardAccessoryView? There's a logic there to get both tracking view and keyboard height.
 *  */
const MAX_HEIGHT = 216;
const getBottom = (trackingViewHeight: number, keyboardHeight: number): number => trackingViewHeight + keyboardHeight + 50;

export const Autocomplete = ({ onPress }: { onPress: IAutocompleteItemProps['onPress'] }): ReactElement | null => {
	const { rid } = useRoomContext();
	const trackingViewHeight = useTrackingViewHeight();
	const keyboardHeight = useKeyboardHeight();
	const { text, type, params } = useAutocompleteParams();
	const items = useAutocomplete({
		rid,
		text,
		type,
		commandParams: params
	});
	const { colors } = useTheme();

	if (items.length === 0 || !type) {
		return null;
	}

	if (type !== '/preview') {
		return (
			<View
				style={{
					maxHeight: MAX_HEIGHT,
					left: 8,
					right: 8,
					backgroundColor: colors.surfaceNeutral,
					position: 'absolute',
					bottom: getBottom(trackingViewHeight, keyboardHeight),
					borderRadius: 4,
					shadowColor: '#000',
					shadowOffset: {
						width: 0,
						height: 2
					},
					shadowOpacity: 0.5,
					shadowRadius: 2,
					elevation: 4
				}}
			>
				<FlatList
					contentContainerStyle={{
						borderRadius: 4,
						overflow: 'hidden'
					}}
					data={items}
					renderItem={({ item }) => <AutocompleteItem item={item} onPress={onPress} />}
					keyboardShouldPersistTaps='always'
				/>
			</View>
		);
	}

	if (type === '/preview') {
		return (
			<View
				style={{
					maxHeight: MAX_HEIGHT,
					left: 8,
					right: 8,
					backgroundColor: colors.surfaceLight,
					position: 'absolute',
					bottom: getBottom(trackingViewHeight, keyboardHeight),
					borderRadius: 4,
					shadowColor: '#000',
					shadowOffset: {
						width: 0,
						height: 2
					},
					shadowOpacity: 0.5,
					shadowRadius: 2,
					elevation: 4
				}}
			>
				<FlatList
					contentContainerStyle={{
						borderRadius: 4,
						overflow: 'hidden'
					}}
					style={{ margin: 8 }}
					horizontal
					data={items}
					renderItem={({ item }) => <AutocompletePreview item={item} onPress={onPress} />}
					keyboardShouldPersistTaps='always'
				/>
			</View>
		);
	}

	return null;
};
