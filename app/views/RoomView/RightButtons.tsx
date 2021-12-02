import React, { Component } from 'react';
import { connect } from 'react-redux';
import { dequal } from 'dequal';
import { Subscription } from 'rxjs';
import Model from '@nozbe/watermelondb/Model';

import * as HeaderButton from '../../containers/HeaderButton';
import database from '../../lib/database';
import { getUserSelector } from '../../selectors/login';
import { events, logEvent } from '../../utils/log';
import { isTeamRoom } from '../../utils/room';

interface IRoomRightButtonsContainerProps {
	userId: string;
	threadsEnabled: boolean;
	rid: string;
	t: string;
	tmid: string;
	teamId: string;
	navigation: any; // TODO - change this after merge react navigation
	isMasterDetail: boolean;
	toggleFollowThread: Function;
	joined: boolean;
	encrypted: boolean;
}

class RightButtonsContainer extends Component<IRoomRightButtonsContainerProps, any> {
	private threadSubscription?: Subscription;
	private subSubscription?: Subscription;

	constructor(props: IRoomRightButtonsContainerProps) {
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

	shouldComponentUpdate(nextProps: IRoomRightButtonsContainerProps, nextState: any) {
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

	observeThread = (threadRecord: Model) => {
		const threadObservable = threadRecord.observe();
		this.threadSubscription = threadObservable.subscribe(thread => this.updateThread(thread));
	};

	updateThread = (thread: any) => {
		const { userId } = this.props;
		this.setState({
			isFollowingThread: thread.replies && !!thread.replies.find((t: string) => t === userId)
		});
	};

	observeSubscription = (subRecord: Model) => {
		const subObservable = subRecord.observe();
		this.subSubscription = subObservable.subscribe(sub => {
			this.updateSubscription(sub);
		});
	};

	updateSubscription = (sub: any) => {
		this.setState({
			tunread: sub?.tunread,
			tunreadUser: sub?.tunreadUser,
			tunreadGroup: sub?.tunreadGroup
		});
	};

	goTeamChannels = () => {
		logEvent(events.ROOM_GO_TEAM_CHANNELS);
		const { navigation, isMasterDetail, teamId } = this.props;
		if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', {
				screen: 'TeamChannelsView',
				params: { teamId }
			});
		} else {
			navigation.navigate('TeamChannelsView', { teamId });
		}
	};

	goThreadsView = () => {
		logEvent(events.ROOM_GO_THREADS);
		const { rid, t, navigation, isMasterDetail } = this.props;
		if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', { screen: 'ThreadMessagesView', params: { rid, t } });
		} else {
			navigation.navigate('ThreadMessagesView', { rid, t });
		}
	};

	goSearchView = () => {
		logEvent(events.ROOM_GO_SEARCH);
		const { rid, t, navigation, isMasterDetail, encrypted } = this.props;
		if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', {
				screen: 'SearchMessagesView',
				params: { rid, showCloseModal: true, encrypted }
			});
		} else {
			navigation.navigate('SearchMessagesView', { rid, t, encrypted });
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

const mapStateToProps = (state: any) => ({
	userId: getUserSelector(state).id,
	threadsEnabled: state.settings.Threads_enabled,
	isMasterDetail: state.app.isMasterDetail
});

export default connect(mapStateToProps)(RightButtonsContainer);
