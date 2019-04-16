import React from 'react';
import { StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { CustomHeaderButtons, Item } from '../../../containers/HeaderButton';
import database, { safeAddListener } from '../../../lib/realm';
import RocketChat from '../../../lib/rocketchat';
import log from '../../../utils/log';

const styles = StyleSheet.create({
	more: {
		marginHorizontal: 0, marginLeft: 0, marginRight: 5
	},
	thread: {
		marginHorizontal: 0, marginLeft: 0, marginRight: 10
	}
});

@connect(state => ({
	userId: state.login.user && state.login.user.id,
	threadsEnabled: state.settings.Threads_enabled
}))
class RightButtonsContainer extends React.PureComponent {
	static propTypes = {
		userId: PropTypes.string,
		threadsEnabled: PropTypes.bool,
		rid: PropTypes.string,
		t: PropTypes.string,
		tmid: PropTypes.string,
		navigation: PropTypes.object
	};

	constructor(props) {
		super(props);
		if (props.tmid) {
			this.thread = database.objectForPrimaryKey('messages', props.tmid);
			safeAddListener(this.thread, this.updateThread);
		}
		this.state = {
			isFollowingThread: true
		};
	}

	updateThread = () => {
		const { userId } = this.props;
		this.setState({
			isFollowingThread: this.thread.replies && !!this.thread.replies.find(t => t === userId)
		});
	}

	goThreadsView = () => {
		const { rid, t, navigation } = this.props;
		navigation.navigate('ThreadMessagesView', { rid, t });
	}

	goRoomActionsView = () => {
		const { rid, t, navigation } = this.props;
		navigation.navigate('RoomActionsView', { rid, t });
	}

	toggleFollowThread = async() => {
		const { isFollowingThread } = this.state;
		const { tmid } = this.props;
		try {
			await RocketChat.toggleFollowMessage(tmid, !isFollowingThread);
		} catch (e) {
			console.log('TCL: RightButtonsContainer -> toggleFollowThread -> e', e);
			log('toggleFollowThread', e);
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
						iconName={isFollowingThread ? 'Bell-off' : 'bell'}
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

export default RightButtonsContainer;
