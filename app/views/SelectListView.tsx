import React from 'react';
import { NativeStackNavigationOptions, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { connect } from 'react-redux';
import { RouteProp } from '@react-navigation/native';

import { ChatsStackParamList } from '../stacks/types';
import log from '../lib/methods/helpers/log';
import * as List from '../containers/List';
import I18n from '../i18n';
import * as HeaderButton from '../containers/HeaderButton';
import StatusBar from '../containers/StatusBar';
import { themes } from '../lib/constants';
import { TSupportedThemes, withTheme } from '../theme';
import SafeAreaView from '../containers/SafeAreaView';
import { animateNextTransition } from '../lib/methods/helpers/layoutAnimation';
import { ICON_SIZE } from '../containers/List/constants';
import SearchBox from '../containers/SearchBox';
import Radio from '../containers/Radio';
import sharedStyles from './Styles';
import { IApplicationState } from '../definitions';
import { TDataSelect } from '../definitions/IDataSelect';

const styles = StyleSheet.create({
	buttonText: {
		fontSize: 16,
		margin: 16,
		...sharedStyles.textRegular
	}
});

interface ISelectListViewState {
	data?: TDataSelect[];
	dataFiltered?: TDataSelect[];
	isSearching: boolean;
	selected: string[];
}

interface ISelectListViewProps {
	navigation: NativeStackNavigationProp<ChatsStackParamList, 'SelectListView'>;
	route: RouteProp<ChatsStackParamList, 'SelectListView'>;
	theme: TSupportedThemes;
	isMasterDetail: boolean;
}

class SelectListView extends React.Component<ISelectListViewProps, ISelectListViewState> {
	private title: string;

	private infoText: string;

	private nextAction: (selected: string[]) => void;

	private showAlert: () => void;

	private isSearch: boolean;

	private onSearch?: (text: string) => Promise<TDataSelect[] | any>;

	private isRadio?: boolean;

	constructor(props: ISelectListViewProps) {
		super(props);
		const data = props.route?.params?.data;
		this.title = props.route?.params?.title;
		this.infoText = props.route?.params?.infoText ?? '';
		this.nextAction = props.route?.params?.nextAction;
		this.showAlert = props.route?.params?.showAlert ?? (() => {});
		this.isSearch = props.route?.params?.isSearch ?? false;
		this.onSearch = props.route?.params?.onSearch;
		this.isRadio = props.route?.params?.isRadio;
		this.state = {
			data,
			dataFiltered: [],
			isSearching: false,
			selected: []
		};
		this.setHeader();
	}

	setHeader = () => {
		const { navigation, isMasterDetail } = this.props;
		const { selected } = this.state;

		const options: NativeStackNavigationOptions = {
			headerTitle: I18n.t(this.title)
		};

		if (isMasterDetail) {
			options.headerLeft = () => <HeaderButton.CloseModal navigation={navigation} />;
		}

		options.headerRight = () => (
			<HeaderButton.Container>
				<HeaderButton.Item title={I18n.t('Next')} onPress={() => this.nextAction(selected)} testID='select-list-view-submit' />
			</HeaderButton.Container>
		);

		navigation.setOptions(options);
	};

	renderInfoText = () => {
		const { theme } = this.props;
		return (
			<View style={{ backgroundColor: themes[theme].surfaceRoom }}>
				<Text style={[styles.buttonText, { color: themes[theme].fontDefault }]}>{I18n.t(this.infoText)}</Text>
			</View>
		);
	};

	renderSearch = () => <SearchBox onChangeText={(text: string) => this.search(text)} testID='select-list-view-search' />;

	search = async (text: string) => {
		try {
			this.setState({ isSearching: true });
			const result = await this.onSearch?.(text);
			this.setState({ dataFiltered: result });
		} catch (e) {
			log(e);
		}
	};

	isChecked = (rid: string) => {
		const { selected } = this.state;
		return selected.includes(rid);
	};

	toggleItem = (rid: string) => {
		const { selected } = this.state;

		animateNextTransition();
		if (this.isRadio) {
			if (!this.isChecked(rid)) {
				this.setState({ selected: [rid] }, () => this.setHeader());
			}
		} else if (!this.isChecked(rid)) {
			this.setState({ selected: [...selected, rid] }, () => this.setHeader());
		} else {
			const filterSelected = selected.filter(el => el !== rid);
			this.setState({ selected: filterSelected }, () => this.setHeader());
		}
	};

	renderItem = ({ item }: { item: TDataSelect }) => {
		const { theme } = this.props;
		const { selected } = this.state;

		const channelIcon = item.t === 'p' ? 'channel-private' : 'channel-public';
		const teamIcon = item.t === 'p' ? 'teams-private' : 'teams';
		const icon = item.teamMain ? teamIcon : channelIcon;
		const checked = this.isChecked(item.rid) ? 'check' : '';

		const showRadio = () => (
			<Radio
				testID={selected ? `radio-button-selected-${item.name}` : `radio-button-unselected-${item.name}`}
				check={selected.includes(item.rid)}
				size={ICON_SIZE}
			/>
		);
		const showCheck = () =>
			checked !== '' ? (
				<List.Icon
					testID={checked ? `${item.name}-checked` : `${item.name}-unchecked`}
					name={checked}
					color={themes[theme].fontHint}
				/>
			) : null;

		const handleAcessibilityLabel = (rid: string) => {
			let label = '';
			if (this.isRadio) {
				label = this.isChecked(rid) ? I18n.t('Selected') : I18n.t('Unselected');
			} else {
				label = this.isChecked(rid) ? I18n.t('Checked') : I18n.t('Unchecked');
			}
			return label;
		};

		return (
			<>
				<List.Separator />
				<List.Item
					title={item.name}
					translateTitle={false}
					testID={`select-list-view-item-${item.name}`}
					onPress={() => (item.alert ? this.showAlert() : this.toggleItem(item.rid))}
					alert={item.alert}
					left={() => <List.Icon name={icon} color={themes[theme].fontHint} />}
					right={() => (this.isRadio ? showRadio() : showCheck())}
					additionalAcessibilityLabel={handleAcessibilityLabel(item.rid)}
				/>
			</>
		);
	};

	render() {
		const { data, isSearching, dataFiltered } = this.state;
		const { theme } = this.props;
		return (
			<SafeAreaView testID='select-list-view'>
				<StatusBar />
				<FlatList
					data={!isSearching ? data : dataFiltered}
					extraData={this.state}
					keyExtractor={item => item.rid}
					renderItem={this.renderItem}
					ListHeaderComponent={this.isSearch ? this.renderSearch : this.renderInfoText}
					contentContainerStyle={{ backgroundColor: themes[theme].surfaceRoom }}
					keyboardShouldPersistTaps='always'
				/>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	isMasterDetail: state.app.isMasterDetail
});

export default connect(mapStateToProps)(withTheme(SelectListView));
