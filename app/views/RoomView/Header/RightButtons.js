import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import isEqual from 'react-fast-compare';

import * as HeaderButton from '../../../containers/HeaderButton';
import database from '../../../lib/database';
import { getUserSelector } from '../../../selectors/login';
import { logEvent, events } from '../../../utils/log';

class RightButtonsContainer extends Component {
	static propTypes = {
		userId: PropTypes.string,
		threadsEnabled: PropTypes.bool,
		rid: PropTypes.string,
		t: PropTypes.string,
		tmid: PropTypes.string,
		navigation: PropTypes.object,
		isMasterDetail: PropTypes.bool,
		toggleFollowThread: PropTypes.func
	};

	constructor(props) {
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
				const threadRecord = await db.collections.get('messages').find(tmid);
				this.observeThread(threadRecord);
			} catch (e) {
				console.log('Can\'t find message to observe.');
			}
		}
		if (rid) {
			try {
				const subCollection = db.collections.get('subscriptions');
				const subRecord = await subCollection.find(rid);
				this.observeSubscription(subRecord);
			} catch (e) {
				console.log('Can\'t find subscription to observe.');
			}
		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		const {
			isFollowingThread, tunread, tunreadUser, tunreadGroup
		} = this.state;
		if (nextState.isFollowingThread !== isFollowingThread) {
			return true;
		}
		if (!isEqual(nextState.tunread, tunread)) {
			return true;
		}
		if (!isEqual(nextState.tunreadUser, tunreadUser)) {
			return true;
		}
		if (!isEqual(nextState.tunreadGroup, tunreadGroup)) {
			return true;
		}
	}

	componentWillUnmount() {
		if (this.threadSubscription && this.threadSubscription.unsubscribe) {
			this.threadSubscription.unsubscribe();
		}
		if (this.subSubscription && this.subSubscription.unsubscribe) {
			this.subSubscription.unsubscribe();
		}
	}

	observeThread = (threadRecord) => {
		const threadObservable = threadRecord.observe();
		this.threadSubscription = threadObservable
			.subscribe(thread => this.updateThread(thread));
	}

	updateThread = (thread) => {
		const { userId } = this.props;
		this.setState({
			isFollowingThread: thread.replies && !!thread.replies.find(t => t === userId)
		});
	}

	observeSubscription = (subRecord) => {
		const subObservable = subRecord.observe();
		this.subSubscription = subObservable
			.subscribe((sub) => {
				this.updateSubscription(sub);
			});
	}

	updateSubscription = (sub) => {
		this.setState({
			tunread: sub?.tunread,
			tunreadUser: sub?.tunreadUser,
			tunreadGroup: sub?.tunreadGroup
		});
	}

	goThreadsView = () => {
		logEvent(events.ROOM_GO_THREADS);
		const {
			rid, t, navigation, isMasterDetail
		} = this.props;
		if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', { screen: 'ThreadMessagesView', params: { rid, t } });
		} else {
			navigation.navigate('ThreadMessagesView', { rid, t });
		}
	}

	goSearchView = () => {
		logEvent(events.ROOM_GO_SEARCH);
		const {
			rid, navigation, isMasterDetail
		} = this.props;
		if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', { screen: 'SearchMessagesView', params: { rid, showCloseModal: true } });
		} else {
			navigation.navigate('SearchMessagesView', { rid });
		}
	}

	toggleFollowThread = () => {
		logEvent(events.ROOM_TOGGLE_FOLLOW_THREADS);
		const { isFollowingThread } = this.state;
		const { toggleFollowThread } = this.props;
		if (toggleFollowThread) {
			toggleFollowThread(isFollowingThread);
		}
	}

	render() {
		const {
			isFollowingThread, tunread, tunreadUser, tunreadGroup
		} = this.state;
		const { t, tmid, threadsEnabled } = this.props;
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
				{threadsEnabled ? (
					<HeaderButton.Item
						iconName='threads'
						onPress={this.goThreadsView}
						testID='room-view-header-threads'
						badge={() => (
							<HeaderButton.Badge
								tunread={tunread}
								tunreadUser={tunreadUser}
								tunreadGroup={tunreadGroup}
							/>
						)}
					/>
				) : null}
				<HeaderButton.Item
					iconName='search'
					onPress={this.goSearchView}
					testID='room-view-search'
				/>
			</HeaderButton.Container>
		);
	}
}

const mapStateToProps = state => ({
	userId: getUserSelector(state).id,
	threadsEnabled: state.settings.Threads_enabled,
	isMasterDetail: state.app.isMasterDetail
});

export default connect(mapStateToProps)(RightButtonsContainer);
