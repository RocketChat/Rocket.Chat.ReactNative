import React from 'react';
import { StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { CustomHeaderButtons, Item } from '../../../containers/HeaderButton';
import database from '../../../lib/database';

const styles = StyleSheet.create({
	more: {
		marginHorizontal: 0,
		marginLeft: 0,
		marginRight: 5
	},
	thread: {
		marginHorizontal: 0,
		marginLeft: 0,
		marginRight: 15
	}
});

class RightButtonsContainer extends React.PureComponent {
	static propTypes = {
		userId: PropTypes.string,
		threadsEnabled: PropTypes.bool,
		rid: PropTypes.string,
		t: PropTypes.string,
		tmid: PropTypes.string,
		navigation: PropTypes.object,
		toggleFollowThread: PropTypes.func,
		room: PropTypes.object
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
		const { rid, t, navigation } = this.props;
		navigation.navigate('ThreadMessagesView', { rid, t });
	}

	goRoomActionsView = () => {
		const {
			rid, t, navigation, room
		} = this.props;
		navigation.navigate('RoomActionsView', { rid, t, room });
	}

	toggleFollowThread = () => {
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
				<CustomHeaderButtons>
					<Item
						title='bell'
						iconName={isFollowingThread ? 'bell' : 'Bell-off'}
						onPress={this.toggleFollowThread}
						testID={isFollowingThread ? 'room-view-header-unfollow' : 'room-view-header-follow'}
					/>
				</CustomHeaderButtons>
			);
		}
		return (
			<CustomHeaderButtons>
				{threadsEnabled ? (
					<Item
						title='thread'
						iconName='thread'
						onPress={this.goThreadsView}
						testID='room-view-header-threads'
						buttonStyle={styles.thread}
					/>
				) : null}
				<Item
					title='more'
					iconName='menu'
					onPress={this.goRoomActionsView}
					testID='room-view-header-actions'
					buttonStyle={styles.more}
				/>
			</CustomHeaderButtons>
		);
	}
}

const mapStateToProps = state => ({
	userId: state.login.user && state.login.user.id,
	threadsEnabled: state.settings.Threads_enabled
});

export default connect(mapStateToProps)(RightButtonsContainer);
