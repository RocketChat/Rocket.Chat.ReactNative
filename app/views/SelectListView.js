import React from 'react';
import PropTypes from 'prop-types';
import {
	View, StyleSheet, FlatList, Text
} from 'react-native';
import { connect } from 'react-redux';
import { RadioButton } from 'react-native-ui-lib';

import log from '../utils/log';
import * as List from '../containers/List';
import sharedStyles from './Styles';
import I18n from '../i18n';
import * as HeaderButton from '../containers/HeaderButton';
import StatusBar from '../containers/StatusBar';
import { themes } from '../constants/colors';
import { withTheme } from '../theme';
import SafeAreaView from '../containers/SafeAreaView';
import { animateNextTransition } from '../utils/layoutAnimation';
import { ICON_SIZE } from '../containers/List/constants';
import SearchBox from '../containers/SearchBox';


const styles = StyleSheet.create({
	buttonText: {
		fontSize: 16,
		margin: 16,
		...sharedStyles.textRegular
	}
});

class SelectListView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object,
		route: PropTypes.object,
		theme: PropTypes.string,
		isMasterDetail: PropTypes.bool
	};

	constructor(props) {
		super(props);
		const data = props.route?.params?.data;
		this.title = props.route?.params?.title;
		this.infoText = props.route?.params?.infoText;
		this.nextAction = props.route?.params?.nextAction;
		this.showAlert = props.route?.params?.showAlert;
		this.isSearch = props.route?.params?.isSearch;
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

		const options = {
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
	}

	renderInfoText = () => {
		const { theme } = this.props;
		return (
			<View style={{ backgroundColor: themes[theme].backgroundColor }}>
				<Text style={[styles.buttonText, { color: themes[theme].bodyText }]}>{I18n.t(this.infoText)}</Text>
			</View>
		);
	}

	renderSearch = () => {
		const { theme } = this.props;
		return (
			<View style={{ backgroundColor: themes[theme].auxiliaryBackground }}>
				<SearchBox onChangeText={text => this.search(text)} testID='select-list-view-search' onCancelPress={() => this.setState({ isSearching: false })} />
			</View>
		);
	}

	search = async(text) => {
		try {
			this.setState({ isSearching: true });
			const result = await this.onSearch(text);
			this.setState({ dataFiltered: result });
		} catch (e) {
			log(e);
		}
	}

	isChecked = (rid) => {
		const { selected } = this.state;
		return selected.includes(rid);
	}

	toggleItem = (rid) => {
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
	}

	renderItem = ({ item }) => {
		const { theme } = this.props;
		const { selected } = this.state;

		const channelIcon = item.t === 'p' ? 'channel-private' : 'channel-public';
		const teamIcon = item.t === 'p' ? 'teams-private' : 'teams';
		const icon = item.teamMain ? teamIcon : channelIcon;
		const checked = this.isChecked(item.rid) ? 'check' : null;

		const showRadio = () => <RadioButton selected={selected.includes(item.rid)} color={themes[theme].actionTintColor} size={ICON_SIZE} />;
		const showCheck = () => <List.Icon name={checked} color={themes[theme].actionTintColor} />;

		return (
			<>
				<List.Separator />
				<List.Item
					title={item.name}
					translateTitle={false}
					testID={`select-list-view-item-${ item.name }`}
					onPress={() => (item.alert ? this.showAlert() : this.toggleItem(item.rid))}
					alert={item.alert}
					left={() => <List.Icon name={icon} color={themes[theme].controlText} />}
					right={() => (this.isRadio ? showRadio() : showCheck())}
				/>
			</>
		);
	}

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
					contentContainerStyle={{ backgroundColor: themes[theme].backgroundColor }}
					keyboardShouldPersistTaps='always'
				/>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	isMasterDetail: state.app.isMasterDetail
});

export default connect(mapStateToProps)(withTheme(SelectListView));
