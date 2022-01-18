import React from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import I18n from '../i18n';
import { withTheme } from '../theme';
import { themes } from '../constants/colors';
import debounce from '../utils/debounce';
import * as List from '../containers/List';
import SearchBox from '../containers/SearchBox';
import SafeAreaView from '../containers/SafeAreaView';
import sharedStyles from './Styles';
import { ChatsStackParamList } from '../stacks/types';
import { IOptionsField } from './NotificationPreferencesView/options';

const styles = StyleSheet.create({
	search: {
		width: '100%',
		height: 56
	},
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
	theme: string;
}

interface IPickerViewState {
	data: IOptionsField[];
	value: string;
	offset: number;
	total: number;
	text: string;
}

interface IPickerViewProps {
	navigation: StackNavigationProp<ChatsStackParamList, 'PickerView'>;
	route: RouteProp<ChatsStackParamList, 'PickerView'>;
	theme: string;
}

const Item = React.memo(({ item, selected, onItemPress, theme }: IItem) => (
	<List.Item
		title={I18n.t(item.label, { defaultValue: item.label, second: item?.second })}
		right={() => (selected ? <List.Icon name='check' color={themes[theme].tintColor} /> : null)}
		onPress={onItemPress}
		translateTitle={false}
	/>
));

class PickerView extends React.PureComponent<IPickerViewProps, IPickerViewState> {
	private onSearch?: (text?: string) => Promise<{ data: IOptionsField[] } | undefined>;

	private count: number;

	static navigationOptions = ({ route }: IPickerViewProps) => ({
		title: route.params?.title ?? I18n.t('Select_an_option')
	});

	constructor(props: IPickerViewProps) {
		super(props);
		const data = props.route.params?.data ?? [];
		const value = props.route.params?.value;
		const total = props.route.params?.total ?? 0;
		const offset = props.route.params?.offset ?? 0;
		this.state = { data, value, offset, total, text: '' };

		this.onSearch = props.route.params?.onChangeText;
		this.count = props.route.params?.count ?? 0;
	}

	onChangeValue = (value: string) => {
		const { navigation, route } = this.props;
		const goBack = route.params?.goBack ?? true;
		const onChange = route.params?.onChangeValue ?? (() => {});
		onChange(value);
		if (goBack) {
			navigation.goBack();
		}
	};

	onChangeText = debounce(
		async (text: string) => {
			if (this.onSearch) {
				const data = await this.onSearch(text);
				if (data?.data) {
					this.setState({ ...data, text });
				}
			}
		},
		300,
		true
	);

	onEndReached = async () => {
		const { route } = this.props;
		const { data, offset, total, text } = this.state;
		const onEndReached = route.params?.onEndReached;
		if (onEndReached && offset + this.count < total) {
			const val = await onEndReached(text, offset + this.count);
			if (val?.data) {
				this.setState({ ...val, data: [...data, ...val.data] });
			}
		}
	};

	renderSearch() {
		if (!this.onSearch) {
			return null;
		}

		return (
			<View style={styles.search}>
				<SearchBox onChangeText={this.onChangeText} />
			</View>
		);
	}

	render() {
		const { data, value } = this.state;
		const { theme } = this.props;

		return (
			<SafeAreaView>
				{this.renderSearch()}
				<FlatList
					data={data}
					keyExtractor={item => item.value as string}
					renderItem={({ item }) => (
						<Item
							item={item}
							theme={theme}
							selected={!this.onSearch && (value || data[0]?.value) === item.value}
							onItemPress={() => this.onChangeValue(item.value as string)}
						/>
					)}
					onEndReached={() => this.onEndReached()}
					onEndReachedThreshold={0.5}
					ItemSeparatorComponent={List.Separator}
					ListHeaderComponent={List.Separator}
					ListFooterComponent={List.Separator}
					ListEmptyComponent={() => (
						<Text style={[styles.noResult, { color: themes[theme].titleText }]}>{I18n.t('No_results_found')}</Text>
					)}
					contentContainerStyle={[List.styles.contentContainerStyleFlatList]}
				/>
			</SafeAreaView>
		);
	}
}

export default withTheme(PickerView);
