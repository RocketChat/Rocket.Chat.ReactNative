import React from 'react';
import { StackNavigationOptions, StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { FlatList, View } from 'react-native';
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
import Loading from '../containers/Loading';
import { animateNextTransition } from '../utils/layoutAnimation';
import { goRoom } from '../utils/goRoom';
import { showErrorAlert } from '../utils/info';
import debounce from '../utils/debounce';
import { ChatsStackParamList } from '../stacks/types';
import { TSubscriptionModel, SubscriptionType } from '../definitions';

interface IAddExistingChannelViewState {
	search: TSubscriptionModel[];
	channels: TSubscriptionModel[];
	selected: string[];
	loading: boolean;
}

interface IAddExistingChannelViewProps {
	navigation: StackNavigationProp<ChatsStackParamList, 'AddExistingChannelView'>;
	route: RouteProp<ChatsStackParamList, 'AddExistingChannelView'>;
	theme: string;
	isMasterDetail: boolean;
	addTeamChannelPermission: string[];
}

const QUERY_SIZE = 50;

class AddExistingChannelView extends React.Component<IAddExistingChannelViewProps, IAddExistingChannelViewState> {
	private teamId?: string;

	constructor(props: IAddExistingChannelViewProps) {
		super(props);
		this.query();
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

		const options: StackNavigationOptions = {
			headerTitle: I18n.t('Add_Existing_Channel')
		};

		if (isMasterDetail) {
			options.headerLeft = () => <HeaderButton.CloseModal navigation={navigation} />;
		}

		options.headerRight = () =>
			selected.length > 0 && (
				<HeaderButton.Container>
					<HeaderButton.Item title={I18n.t('Next')} onPress={this.submit} testID='add-existing-channel-view-submit' />
				</HeaderButton.Container>
			);

		navigation.setOptions(options);
	};

	query = async (stringToSearch = '') => {
		try {
			const { addTeamChannelPermission } = this.props;
			const db = database.active;
			const channels = await db
				.get('subscriptions')
				.query(
					Q.where('team_id', ''),
					Q.where('t', Q.oneOf(['c', 'p'])),
					Q.where('name', Q.like(`%${stringToSearch}%`)),
					Q.experimentalTake(QUERY_SIZE),
					Q.experimentalSortBy('room_updated_at', Q.desc)
				)
				.fetch();

			const asyncFilter = async (channelsArray: TSubscriptionModel[]) => {
				const results = await Promise.all(
					channelsArray.map(async channel => {
						if (channel.prid) {
							return false;
						}
						const permissions = await RocketChat.hasPermission([addTeamChannelPermission], channel.rid);
						if (!permissions[0]) {
							return false;
						}
						return true;
					})
				);

				return channelsArray.filter((_v: any, index: number) => results[index]);
			};
			const channelFiltered = await asyncFilter(channels);
			this.setState({ channels: channelFiltered });
		} catch (e) {
			log(e);
		}
	};

	onSearchChangeText = debounce((text: string) => {
		this.query(text);
	}, 300);

	dismiss = () => {
		const { navigation } = this.props;
		return navigation.pop();
	};

	submit = async () => {
		const { selected } = this.state;
		const { isMasterDetail } = this.props;

		this.setState({ loading: true });
		try {
			logEvent(events.CT_ADD_ROOM_TO_TEAM);
			const result = await RocketChat.addRoomsToTeam({ rooms: selected, teamId: this.teamId });
			if (result.success) {
				this.setState({ loading: false });
				// @ts-ignore
				// TODO: Verify goRoom interface for return of call
				goRoom({ item: result, isMasterDetail });
			}
		} catch (e: any) {
			logEvent(events.CT_ADD_ROOM_TO_TEAM_F);
			showErrorAlert(I18n.t(e.data.error), I18n.t('Add_Existing_Channel'), () => {});
			this.setState({ loading: false });
		}
	};

	renderHeader = () => {
		const { theme } = this.props;
		return (
			<View style={{ backgroundColor: themes[theme].auxiliaryBackground }}>
				<SearchBox onChangeText={(text: string) => this.onSearchChangeText(text)} testID='add-existing-channel-view-search' />
			</View>
		);
	};

	isChecked = (rid: string) => {
		const { selected } = this.state;
		return selected.includes(rid);
	};

	toggleChannel = (rid: string) => {
		const { selected } = this.state;

		animateNextTransition();
		if (!this.isChecked(rid)) {
			logEvent(events.AEC_ADD_CHANNEL);
			this.setState({ selected: [...selected, rid] }, () => this.setHeader());
		} else {
			logEvent(events.AEC_REMOVE_CHANNEL);
			const filterSelected = selected.filter(el => el !== rid);
			this.setState({ selected: filterSelected }, () => this.setHeader());
		}
	};

	renderItem = ({ item }: { item: TSubscriptionModel }) => {
		const isChecked = this.isChecked(item.rid);
		// TODO: reuse logic inside RoomTypeIcon
		const icon = item.t === SubscriptionType.DIRECT && !item?.teamId ? 'channel-private' : 'channel-public';
		return (
			<List.Item
				title={RocketChat.getRoomTitle(item)}
				translateTitle={false}
				onPress={() => this.toggleChannel(item.rid)}
				testID={`add-existing-channel-view-item-${item.name}`}
				left={() => <List.Icon name={icon} />}
				right={() => (isChecked ? <List.Icon name='check' /> : null)}
			/>
		);
	};

	renderList = () => {
		const { search, channels } = this.state;
		const { theme } = this.props;
		return (
			<FlatList
				data={search.length > 0 ? search : channels}
				extraData={this.state}
				keyExtractor={item => item.id}
				ListHeaderComponent={this.renderHeader}
				renderItem={this.renderItem}
				ItemSeparatorComponent={List.Separator}
				contentContainerStyle={{ backgroundColor: themes[theme].backgroundColor }}
				keyboardShouldPersistTaps='always'
			/>
		);
	};

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

const mapStateToProps = (state: any) => ({
	isMasterDetail: state.app.isMasterDetail,
	addTeamChannelPermission: state.permissions['add-team-channel']
});

export default connect(mapStateToProps)(withTheme(AddExistingChannelView));
