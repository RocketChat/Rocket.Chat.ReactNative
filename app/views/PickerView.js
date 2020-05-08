import React from 'react';
import PropTypes from 'prop-types';
import {
	View, FlatList, StyleSheet, Text
} from 'react-native';

import I18n from '../i18n';
import { themedHeader } from '../utils/navigation';
import { withTheme } from '../theme';
import { themes } from '../constants/colors';
import debounce from '../utils/debounce';
import sharedStyles from './Styles';

import ListItem from '../containers/ListItem';
import Check from '../containers/Check';
import Separator from '../containers/Separator';
import SearchBox from '../containers/SearchBox';

const styles = StyleSheet.create({
	check: {
		marginHorizontal: 0
	},
	search: {
		width: '100%',
		height: 56
	},
	noResult: {
		fontSize: 16,
		paddingVertical: 56,
		...sharedStyles.textAlignCenter,
		...sharedStyles.textSemibold
	},
	withoutBorder: {
		borderBottomWidth: 0,
		borderTopWidth: 0
	}
});

const Item = React.memo(({
	item,
	selected,
	onItemPress,
	theme
}) => (
	<ListItem
		title={item.label}
		right={selected && (() => <Check theme={theme} style={styles.check} />)}
		onPress={onItemPress}
		theme={theme}
	/>
));
Item.propTypes = {
	item: PropTypes.object,
	selected: PropTypes.bool,
	onItemPress: PropTypes.func,
	theme: PropTypes.string
};

class PickerView extends React.PureComponent {
	static navigationOptions = ({ navigation, screenProps }) => ({
		title: navigation.getParam('title', I18n.t('Select_an_option')),
		...themedHeader(screenProps.theme)
	})

	static propTypes = {
		navigation: PropTypes.object,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		const data = props.navigation.getParam('data', []);
		const value = props.navigation.getParam('value');
		this.state = { data, value };

		this.onSearch = props.navigation.getParam('onChangeText');
	}

	onChangeValue = (value) => {
		const { navigation } = this.props;
		const goBack = navigation.getParam('goBack', true);
		const onChange = navigation.getParam('onChangeValue', () => {});
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
			<>
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
					ItemSeparatorComponent={() => <Separator theme={theme} />}
					ListEmptyComponent={() => <Text style={[styles.noResult, { color: themes[theme].titleText }]}>{I18n.t('No_results_found')}</Text>}
					contentContainerStyle={[
						sharedStyles.listContentContainer,
						{
							backgroundColor: themes[theme].auxiliaryBackground,
							borderColor: themes[theme].separatorColor
						},
						!data.length && styles.withoutBorder
					]}
					style={{ backgroundColor: themes[theme].auxiliaryBackground }}
				/>
			</>
		);
	}
}

export default withTheme(PickerView);
