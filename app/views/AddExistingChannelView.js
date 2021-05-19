import React from 'react';
import PropTypes from 'prop-types';
import {
	View, FlatList
} from 'react-native';
import { connect } from 'react-redux';
import { Q } from '@nozbe/watermelondb';

import * as List from '../containers/List';
import database from '../lib/database';
import RocketChat from '../lib/rocketchat';
import I18n from '../i18n';
import log, { events, logEvent } from '../utils/log';
import SearchBox from '../containers/SearchBox';
import * as HeaderButton from '../containers/HeaderButton';
import StatusBar from '../containers/StatusBar';
import { themes } from '../constants/colors';
import { withTheme } from '../theme';
import SafeAreaView from '../containers/SafeAreaView';
import { animateNextTransition } from '../utils/layoutAnimation';
import { goRoom } from '../utils/goRoom';
import Loading from '../containers/Loading';

const QUERY_SIZE = 50;

class AddExistingChannelView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object,
		route: PropTypes.object,
		theme: PropTypes.string,
		isMasterDetail: PropTypes.bool,
		addTeamChannelPermission: PropTypes.array
	};

	constructor(props) {
		super(props);
		this.init();
		this.teamId = props.route?.params?.teamId;
		this.state = {
			search: [],
			channels: [],
			selected: [],
			loading: false
		};
		this.setHeader();
	}

	setHeader = () => {
		const { navigation, isMasterDetail } = this.props;
		const { selected } = this.state;

		const options = {
			headerTitle: I18n.t('Add_Existing_Channel')
		};

		if (isMasterDetail) {
			options.headerLeft = () => <HeaderButton.CloseModal navigation={navigation} />;
		}

		options.headerRight = () => selected.length > 0 && (
			<HeaderButton.Container>
				<HeaderButton.Item title={I18n.t('Create')} onPress={this.submit} testID='add-existing-channel-view-submit' />
			</HeaderButton.Container>
		);

		navigation.setOptions(options);
	}

	init = async() => {
		try {
			const { addTeamChannelPermission } = this.props;
			const db = database.active;
			const channels = await db.collections
				.get('subscriptions')
				.query(
					Q.where('team_id', ''),
					Q.where('t', Q.oneOf(['c', 'p'])),
					Q.experimentalTake(QUERY_SIZE),
					Q.experimentalSortBy('room_updated_at', Q.desc)
				)
				.fetch();
			const filteredChannels = channels.filter(async(channel) => {
				const permissions = await RocketChat.hasPermission([addTeamChannelPermission], channel.rid);
				if (!permissions[0]) {
					return;
				}
				return channel;
			});
			this.setState({ channels: filteredChannels });
		} catch (e) {
			log(e);
		}
	}

	onSearchChangeText(text) {
		this.search(text);
	}

	dismiss = () => {
		const { navigation } = this.props;
		return navigation.pop();
	}

	search = async(text) => {
		const result = await RocketChat.search({ text, filterUsers: false });
		this.setState({
			search: result
		});
	}

	submit = async() => {
		const { selected } = this.state;
		const { isMasterDetail } = this.props;

		this.setState({ loading: true });
		try {
			logEvent(events.CT_ADD_ROOM_TO_TEAM);
			const result = await RocketChat.addRoomsToTeam({ rooms: selected, teamId: this.teamId });
			if (result.success) {
				this.setState({ loading: false });
				goRoom({ item: result, isMasterDetail });
			}
		} catch (e) {
			logEvent(events.CT_ADD_ROOM_TO_TEAM_F);
			this.setState({ loading: false });
		}
	}

	renderHeader = () => {
		const { theme } = this.props;
		return (
			<View style={{ backgroundColor: themes[theme].auxiliaryBackground }}>
				<SearchBox onChangeText={text => this.onSearchChangeText(text)} testID='add-existing-channel-view-search' />
			</View>
		);
	}

	isChecked = (rid) => {
		const { selected } = this.state;
		return selected.includes(rid);
	}

	toggleChannel = (rid) => {
		const { selected } = this.state;

		animateNextTransition();
		if (!this.isChecked(rid)) {
			logEvent(events.EXISTING_CHANNEL_ADD_CHANNEL);
			this.setState({ selected: [...selected, rid] }, () => this.setHeader());
		} else {
			logEvent(events.EXISTING_CHANNEL_REMOVE_CHANNEL);
			const filterSelected = selected.filter(el => el !== rid);
			this.setState({ selected: filterSelected }, () => this.setHeader());
		}
	}

	renderItem = ({ item }) => {
		const isChecked = this.isChecked(item.rid);
		// TODO: reuse logic inside RoomTypeIcon
		const icon = item.t === 'p' && !item.teamId ? 'channel-private' : 'channel-public';
		return (
			<List.Item
				title={RocketChat.getRoomTitle(item)}
				translateTitle={false}
				onPress={() => this.toggleChannel(item.rid)}
				testID='add-existing-channel-view-item'
				left={() => <List.Icon name={icon} />}
				right={() => (isChecked ? <List.Icon name='check' /> : null)}
			/>

		);
	}

	renderList = () => {
		const { search, channels } = this.state;
		const { theme } = this.props;
		return (
			<FlatList
				data={search.length > 0 ? search : channels}
				extraData={this.state}
				keyExtractor={item => item._id}
				ListHeaderComponent={this.renderHeader}
				renderItem={this.renderItem}
				ItemSeparatorComponent={List.Separator}
				contentContainerStyle={{ backgroundColor: themes[theme].backgroundColor }}
				keyboardShouldPersistTaps='always'
			/>
		);
	}

	render() {
		const { loading } = this.state;

		return (
			<SafeAreaView testID='add-existing-channel-view'>
				<StatusBar />
				{this.renderList()}
				<Loading visible={loading} />
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	isMasterDetail: state.app.isMasterDetail,
	addTeamChannelPermission: state.permissions['add-team-channel']
});

export default connect(mapStateToProps)(withTheme(AddExistingChannelView));
