import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import * as HeaderButton from '../../../containers/HeaderButton';
import database from '../../../lib/database';
import { getUserSelector } from '../../../selectors/login';
import { logEvent, events } from '../../../utils/log';


class RightButtonsContainer extends React.PureComponent {
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
			isFollowingThread: true
		};
	}

	async componentDidMount() {
		const { tmid } = this.props;
		if (tmid) {
			const db = database.active;
			try {
				const threadRecord = await db.collections.get('messages').find(tmid);
				this.observeThead(threadRecord);
			} catch (e) {
				console.log('Can\'t find message to observe.');
			}
		}
	}

	componentWillUnmount() {
		if (this.threadSubscription && this.threadSubscription.unsubscribe) {
			this.threadSubscription.unsubscribe();
		}
	}

	observeThead = (threadRecord) => {
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
		const { isFollowingThread } = this.state;
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
