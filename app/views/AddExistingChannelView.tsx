import React from 'react';
import { StackNavigationOptions, StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { FlatList } from 'react-native';
import { connect } from 'react-redux';
import { Q } from '@nozbe/watermelondb';

import * as List from '../containers/List';
import database from '../lib/database';
import I18n from '../i18n';
import log, { events, logEvent } from '../lib/methods/helpers/log';
import SearchBox from '../containers/SearchBox';
import * as HeaderButton from '../containers/HeaderButton';
import StatusBar from '../containers/StatusBar';
import { themes } from '../lib/constants';
import { TSupportedThemes, withTheme } from '../theme';
import SafeAreaView from '../containers/SafeAreaView';
import { sendLoadingEvent } from '../containers/Loading';
import { animateNextTransition } from '../lib/methods/helpers/layoutAnimation';
import { goRoom } from '../lib/methods/helpers/goRoom';
import { showErrorAlert } from '../lib/methods/helpers/info';
import { ChatsStackParamList } from '../stacks/types';
import { TSubscriptionModel, SubscriptionType, IApplicationState } from '../definitions';
import { getRoomTitle, hasPermission, debounce } from '../lib/methods/helpers';
import { Services } from '../lib/services';

interface IAddExistingChannelViewState {
	search: TSubscriptionModel[];
	channels: TSubscriptionModel[];
	selected: string[];
}

interface IAddExistingChannelViewProps {
	navigation: StackNavigationProp<ChatsStackParamList, 'AddExistingChannelView'>;
	route: RouteProp<ChatsStackParamList, 'AddExistingChannelView'>;
	theme: TSupportedThemes;
	isMasterDetail: boolean;
	addTeamChannelPermission?: string[];
}

const QUERY_SIZE = 50;

class AddExistingChannelView extends React.Component<IAddExistingChannelViewProps, IAddExistingChannelViewState> {
	private teamId: string;

	constructor(props: IAddExistingChannelViewProps) {
		super(props);
		this.query();
		this.teamId = props.route?.params?.teamId ?? '';
		this.state = {
			search: [],
			channels: [],
			selected: []
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
						const permissions = await hasPermission([addTeamChannelPermission], channel.rid);
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

		sendLoadingEvent({ visible: true });
		try {
			logEvent(events.CT_ADD_ROOM_TO_TEAM);
			const result = await Services.addRoomsToTeam({ rooms: selected, teamId: this.teamId });
			if (result.success) {
				sendLoadingEvent({ visible: false });
				// @ts-ignore
				// TODO: Verify goRoom interface for return of call
				goRoom({ item: result, isMasterDetail });
			}
		} catch (e: any) {
			logEvent(events.CT_ADD_ROOM_TO_TEAM_F);
			showErrorAlert(I18n.t(e.data.error), I18n.t('Add_Existing_Channel'), () => {});
			sendLoadingEvent({ visible: false });
		}
	};

	renderHeader = () => (
		<SearchBox onChangeText={(text: string) => this.onSearchChangeText(text)} testID='add-existing-channel-view-search' />
	);

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
				title={getRoomTitle(item)}
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
		return (
			<SafeAreaView testID='add-existing-channel-view'>
				<StatusBar />
				{this.renderList()}
			</SafeAreaView>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	isMasterDetail: state.app.isMasterDetail,
	addTeamChannelPermission: state.permissions['add-team-channel']
});

export default connect(mapStateToProps)(withTheme(AddExistingChannelView));
