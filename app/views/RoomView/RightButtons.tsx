import React, { Component } from 'react';
import { connect } from 'react-redux';
import { dequal } from 'dequal';
import { Observable, Subscription } from 'rxjs';
import { StackNavigationProp } from '@react-navigation/stack';

import * as HeaderButton from '../../containers/HeaderButton';
import database from '../../lib/database';
import { getUserSelector } from '../../selectors/login';
import { events, logEvent } from '../../lib/methods/helpers/log';
import { isTeamRoom } from '../../lib/methods/helpers/room';
import { IApplicationState, SubscriptionType, TMessageModel, TSubscriptionModel } from '../../definitions';
import { ChatsStackParamList } from '../../stacks/types';

interface IRightButtonsProps {
	userId?: string;
	threadsEnabled: boolean;
	rid?: string;
	t: string;
	tmid?: string;
	teamId?: string;
	isMasterDetail: boolean;
	toggleFollowThread: Function;
	joined: boolean;
	encrypted?: boolean;
	navigation: StackNavigationProp<ChatsStackParamList, 'RoomView'>;
}

interface IRigthButtonsState {
	isFollowingThread: boolean;
	tunread: string[];
	tunreadUser: string[];
	tunreadGroup: string[];
}

class RightButtonsContainer extends Component<IRightButtonsProps, IRigthButtonsState> {
	private threadSubscription?: Subscription;
	private subSubscription?: Subscription;

	constructor(props: IRightButtonsProps) {
		super(props);
		this.state = {
			isFollowingThread: true,
			tunread: [],
			tunreadUser: [],
			tunreadGroup: []
		};
	}

	async componentDidMount() {
		const { tmid, rid } = this.props;
		const db = database.active;
		if (tmid) {
			try {
				const threadRecord = await db.get('messages').find(tmid);
				this.observeThread(threadRecord);
			} catch (e) {
				console.log("Can't find message to observe.");
			}
		}
		if (rid) {
			try {
				const subCollection = db.get('subscriptions');
				const subRecord = await subCollection.find(rid);
				this.observeSubscription(subRecord);
			} catch (e) {
				console.log("Can't find subscription to observe.");
			}
		}
	}

	shouldComponentUpdate(nextProps: IRightButtonsProps, nextState: IRigthButtonsState) {
		const { isFollowingThread, tunread, tunreadUser, tunreadGroup } = this.state;
		const { teamId } = this.props;
		if (nextProps.teamId !== teamId) {
			return true;
		}
		if (nextState.isFollowingThread !== isFollowingThread) {
			return true;
		}
		if (!dequal(nextState.tunread, tunread)) {
			return true;
		}
		if (!dequal(nextState.tunreadUser, tunreadUser)) {
			return true;
		}
		if (!dequal(nextState.tunreadGroup, tunreadGroup)) {
			return true;
		}
		return false;
	}

	componentWillUnmount() {
		if (this.threadSubscription && this.threadSubscription.unsubscribe) {
			this.threadSubscription.unsubscribe();
		}
		if (this.subSubscription && this.subSubscription.unsubscribe) {
			this.subSubscription.unsubscribe();
		}
	}

	observeThread = (threadRecord: TMessageModel) => {
		const threadObservable: Observable<TMessageModel> = threadRecord.observe();
		this.threadSubscription = threadObservable.subscribe(thread => this.updateThread(thread));
	};

	updateThread = (thread: TMessageModel) => {
		const { userId } = this.props;
		this.setState({
			isFollowingThread: (thread.replies && !!thread.replies.find(t => t === userId)) ?? false
		});
	};

	observeSubscription = (subRecord: TSubscriptionModel) => {
		const subObservable = subRecord.observe();
		this.subSubscription = subObservable.subscribe(sub => {
			this.updateSubscription(sub);
		});
	};

	updateSubscription = (sub: TSubscriptionModel) => {
		this.setState({
			tunread: sub?.tunread ?? [],
			tunreadUser: sub?.tunreadUser ?? [],
			tunreadGroup: sub?.tunreadGroup ?? []
		});
	};

	goTeamChannels = () => {
		logEvent(events.ROOM_GO_TEAM_CHANNELS);
		const { navigation, isMasterDetail, teamId, joined } = this.props;
		if (!teamId) {
			return;
		}
		if (isMasterDetail) {
			// @ts-ignore TODO: find a way to make this work
			navigation.navigate('ModalStackNavigator', {
				screen: 'TeamChannelsView',
				params: { teamId, joined }
			});
		} else {
			navigation.navigate('TeamChannelsView', { teamId, joined });
		}
	};

	goThreadsView = () => {
		logEvent(events.ROOM_GO_THREADS);
		const { rid, t, navigation, isMasterDetail } = this.props;
		if (!rid) {
			return;
		}
		if (isMasterDetail) {
			// @ts-ignore TODO: find a way to make this work
			navigation.navigate('ModalStackNavigator', { screen: 'ThreadMessagesView', params: { rid, t } });
		} else {
			navigation.navigate('ThreadMessagesView', { rid, t: t as SubscriptionType });
		}
	};

	goSearchView = () => {
		logEvent(events.ROOM_GO_SEARCH);
		const { rid, t, navigation, isMasterDetail, encrypted } = this.props;
		if (!rid) {
			return;
		}
		if (isMasterDetail) {
			// @ts-ignore TODO: find a way to make this work
			navigation.navigate('ModalStackNavigator', {
				screen: 'SearchMessagesView',
				params: { rid, showCloseModal: true, encrypted }
			});
		} else {
			navigation.navigate('SearchMessagesView', { rid, t: t as SubscriptionType, encrypted });
		}
	};

	toggleFollowThread = () => {
		logEvent(events.ROOM_TOGGLE_FOLLOW_THREADS);
		const { isFollowingThread } = this.state;
		const { toggleFollowThread } = this.props;
		if (toggleFollowThread) {
			toggleFollowThread(isFollowingThread);
		}
	};

	render() {
		const { isFollowingThread, tunread, tunreadUser, tunreadGroup } = this.state;
		const { t, tmid, threadsEnabled, teamId, joined } = this.props;
		if (t === 'l') {
			return null;
		}
		if (tmid) {
			return (
				<HeaderButton.Container>
					<HeaderButton.Item
						iconName={isFollowingThread ? 'notification' : 'notification-disabled'}
						onPress={this.toggleFollowThread}
						testID={isFollowingThread ? 'room-view-header-unfollow' : 'room-view-header-follow'}
					/>
				</HeaderButton.Container>
			);
		}
		return (
			<HeaderButton.Container>
				{isTeamRoom({ teamId, joined }) ? (
					<HeaderButton.Item iconName='channel-public' onPress={this.goTeamChannels} testID='room-view-header-team-channels' />
				) : null}
				{threadsEnabled ? (
					<HeaderButton.Item
						iconName='threads'
						onPress={this.goThreadsView}
						testID='room-view-header-threads'
						badge={() => <HeaderButton.Badge tunread={tunread} tunreadUser={tunreadUser} tunreadGroup={tunreadGroup} />}
					/>
				) : null}
				<HeaderButton.Item iconName='search' onPress={this.goSearchView} testID='room-view-search' />
			</HeaderButton.Container>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	userId: getUserSelector(state).id,
	threadsEnabled: state.settings.Threads_enabled as boolean,
	isMasterDetail: state.app.isMasterDetail
});

export default connect(mapStateToProps)(RightButtonsContainer);
