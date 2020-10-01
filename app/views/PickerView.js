import React from 'react';
import PropTypes from 'prop-types';
import {
	View, FlatList, StyleSheet, Text
} from 'react-native';

import I18n from '../i18n';
import { withTheme } from '../theme';
import { themes } from '../constants/colors';
import debounce from '../utils/debounce';
import sharedStyles from './Styles';

import * as List from '../containers/List';
import SearchBox from '../containers/SearchBox';
import SafeAreaView from '../containers/SafeAreaView';

const styles = StyleSheet.create({
	search: {
		width: '100%',
		height: 56
	},
	noResult: {
		fontSize: 16,
		paddingVertical: 56,
		...sharedStyles.textAlignCenter,
		...sharedStyles.textSemibold
	}
});

const Item = React.memo(({
	item,
	selected,
	onItemPress,
	theme
}) => (
	<List.Item
		title={I18n.t(item.label, { defaultValue: item.label, second: item?.second })}
		right={selected && (() => <List.Icon name='check' color={themes[theme].tintColor} />)}
		onPress={onItemPress}
		translateTitle={false}
	/>
));
Item.propTypes = {
	item: PropTypes.object,
	selected: PropTypes.bool,
	onItemPress: PropTypes.func,
	theme: PropTypes.string
};

class PickerView extends React.PureComponent {
	static navigationOptions = ({ route }) => ({
		title: route.params?.title ?? I18n.t('Select_an_option')
	})

	static propTypes = {
		navigation: PropTypes.object,
		route: PropTypes.object,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		const data = props.route.params?.data ?? [];
		const value = props.route.params?.value;
		this.state = { data, value };

		this.onSearch = props.route.params?.onChangeText;
	}

	onChangeValue = (value) => {
		const { navigation, route } = this.props;
		const goBack = route.params?.goBack ?? true;
		const onChange = route.params?.onChangeValue ?? (() => {});
		onChange(value);
		if (goBack) {
			navigation.goBack();
		}
	}

	onChangeText = debounce(async(text) => {
		if (this.onSearch) {
			const data = await this.onSearch(text);
			this.setState({ data });
		}
	}, 300, true)

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
					keyExtractor={item => item.value}
					renderItem={({ item }) => (
						<Item
							item={item}
							theme={theme}
							selected={!this.onSearch && (value || data[0]?.value) === item.value}
							onItemPress={() => this.onChangeValue(item.value)}
						/>
					)}
					ItemSeparatorComponent={List.Separator}
					ListHeaderComponent={List.Separator}
					ListFooterComponent={List.Separator}
					ListEmptyComponent={() => <Text style={[styles.noResult, { color: themes[theme].titleText }]}>{I18n.t('No_results_found')}</Text>}
					contentContainerStyle={[List.styles.contentContainerStyleFlatList]}
				/>
			</SafeAreaView>
		);
	}
}

export default withTheme(PickerView);
