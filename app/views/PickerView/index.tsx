import { type ReactElement, useLayoutEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, type TextInputProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { textInputDebounceTime } from '~/lib/constants/debounceConfig';
import * as List from '~/containers/List';
import SafeAreaView from '~/containers/SafeAreaView';
import SearchBox from '~/containers/SearchBox';
import I18n from '~/i18n';
import { useAppNavigation, useAppRoute } from '~/lib/hooks/navigation';
import { useDebounce } from '~/lib/methods/helpers';
import { type TNavigation } from '~/stacks/stackType';
import { useTheme } from '~/theme';
import sharedStyles from '../Styles';
import { PlainSeparator } from '~/containers/NativeListRow/Separator';
import { useListBackgroundColor } from '~/containers/NativeListRow/useListBackgroundColor';
import Item from './Item';

const styles = StyleSheet.create({
	noResult: {
		fontSize: 16,
		paddingVertical: 56,
		...sharedStyles.textSemibold,
		...sharedStyles.textAlignCenter
	}
});

const RenderSearch = ({ onChangeText }: TextInputProps) => (
	<>
		<SearchBox onChangeText={onChangeText} />
		<List.Separator />
	</>
);

const PickerView = (): ReactElement => {
	const navigation = useAppNavigation();
	const {
		params: { title, data: paramData, value: paramValue, total: paramTotal, onSearch, onChangeValue, onEndReached }
	} = useAppRoute<TNavigation, 'PickerView'>();

	const { colors } = useTheme();
	const listBackgroundColor = useListBackgroundColor(colors.surfaceHover);

	const { bottom } = useSafeAreaInsets();
	const [data, setData] = useState(paramData);
	const [total, setTotal] = useState(paramTotal ?? 0);
	const [searchText, setSearchText] = useState('');

	useLayoutEffect(() => {
		navigation.setOptions({
			title: title ?? I18n.t('Select_an_option')
		});
	}, [navigation, title]);

	const handleChangeValue = (value: string | number) => {
		onChangeValue(value);
		navigation.goBack();
	};

	const onChangeText = useDebounce(async (text: string) => {
		const search = await onSearch(text);
		if (search?.data) {
			setSearchText(text);
			setData(search?.data);
		}
	}, textInputDebounceTime);

	const handleOnEndReached = async () => {
		if (onEndReached && total && data.length < total) {
			const end = await onEndReached(searchText, data.length);
			if (end?.data) {
				setData([...data, ...end.data]);
				setTotal(end.total);
			}
		}
	};

	return (
		<SafeAreaView style={{ backgroundColor: listBackgroundColor }}>
			<FlatList
				data={data}
				keyExtractor={item => item.value as string}
				renderItem={({ item, index }) => (
					<Item
						item={item}
						selected={(paramValue || data[0]?.value) === item.value}
						onItemPress={() => handleChangeValue(item.value)}
						isFirst={index === 0}
						isLast={index === data.length - 1}
					/>
				)}
				onEndReached={handleOnEndReached}
				onEndReachedThreshold={0.5}
				ItemSeparatorComponent={PlainSeparator}
				ListHeaderComponent={<RenderSearch onChangeText={onChangeText} />}
				contentContainerStyle={{ paddingBottom: bottom }}
				ListFooterComponent={List.Separator}
				ListEmptyComponent={() => (
					<Text style={[styles.noResult, { color: colors.fontTitlesLabels }]}>{I18n.t('No_results_found')}</Text>
				)}
			/>
		</SafeAreaView>
	);
};

export default PickerView;
