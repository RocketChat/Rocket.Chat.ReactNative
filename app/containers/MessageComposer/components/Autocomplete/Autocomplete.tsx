import React, { ReactElement } from 'react';
import { View, FlatList } from 'react-native';

import { useAutocompleteParams, useKeyboardHeight, useTrackingViewHeight } from '../../context';
import { AutocompleteItem } from './AutocompleteItem';
import { useAutocomplete } from '../../hooks';
import { useTheme } from '../../../../theme';
import { IAutocompleteItemProps } from '../../interfaces';
import { AutocompletePreview } from './AutocompletePreview';
import { useRoomContext } from '../../../../views/RoomView/context';

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
					maxHeight: 216,
					left: 8,
					right: 8,
					backgroundColor: colors.surfaceNeutral,
					position: 'absolute',
					bottom: trackingViewHeight + keyboardHeight + 50,
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
					maxHeight: 216,
					left: 8,
					right: 8,
					backgroundColor: colors.surfaceLight,
					position: 'absolute',
					bottom: trackingViewHeight + keyboardHeight + 50,
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
