import React, { useLayoutEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInputProps } from 'react-native';

import * as List from '../containers/List';
import SafeAreaView from '../containers/SafeAreaView';
import SearchBox from '../containers/SearchBox';
import I18n from '../i18n';
import { useAppNavigation, useAppRoute } from '../lib/hooks/navigation';
import { useDebounce } from '../lib/methods/helpers';
import { TNavigation } from '../stacks/stackType';
import { useTheme } from '../theme';
import { IOptionsField } from './NotificationPreferencesView/options';
import sharedStyles from './Styles';

const styles = StyleSheet.create({
	noResult: {
		fontSize: 16,
		paddingVertical: 56,
		...sharedStyles.textSemibold,
		...sharedStyles.textAlignCenter
	}
});

interface IItem {
	item: IOptionsField;
	selected: boolean;
	onItemPress: () => void;
}

const Item = ({ item, selected, onItemPress }: IItem) => {
	const { colors } = useTheme();
	return (
		<List.Item
			title={I18n.t(item.label, { defaultValue: item.label, second: item?.second })}
			right={() => (selected ? <List.Icon name='check' color={colors.badgeBackgroundLevel2} /> : null)}
			onPress={onItemPress}
			translateTitle={false}
			additionalAcessibilityLabel={selected}
			additionalAcessibilityLabelCheck
		/>
	);
};

const RenderSearch = ({ onChangeText }: TextInputProps) => (
	<>
		<SearchBox onChangeText={onChangeText} />
		<List.Separator />
	</>
);

const PickerView = (): React.ReactElement => {
	const navigation = useAppNavigation();
	const {
		params: { title, data: paramData, value: paramValue, total: paramTotal, onSearch, onChangeValue, onEndReached }
	} = useAppRoute<TNavigation, 'PickerView'>();

	const { colors } = useTheme();

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
	}, 500);

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
		<SafeAreaView>
			<FlatList
				data={data}
				keyExtractor={item => item.value as string}
				renderItem={({ item }) => (
					<Item
						item={item}
						selected={(paramValue || data[0]?.value) === item.value}
						onItemPress={() => handleChangeValue(item.value)}
					/>
				)}
				onEndReached={handleOnEndReached}
				onEndReachedThreshold={0.5}
				ItemSeparatorComponent={List.Separator}
				ListHeaderComponent={<RenderSearch onChangeText={onChangeText} />}
				ListFooterComponent={List.Separator}
				ListEmptyComponent={() => (
					<Text style={[styles.noResult, { color: colors.fontTitlesLabels }]}>{I18n.t('No_results_found')}</Text>
				)}
			/>
		</SafeAreaView>
	);
};

export default PickerView;
