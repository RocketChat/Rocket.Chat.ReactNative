import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { CustomHeaderButtons, Item } from '../../../containers/HeaderButton';
import database, { safeAddListener } from '../../../lib/realm';
import RocketChat from '../../../lib/rocketchat';
import log from '../../../utils/log';

@connect(state => ({
	userId: state.login.user && state.login.user.id
}))
class RightButtonsContainer extends React.PureComponent {
	static propTypes = {
		userId: PropTypes.string,
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
		const { t, tmid } = this.props;
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
						testID='room-view-header-toggle-follow'
					/>
				</CustomHeaderButtons>
			);
		}
		return (
			<CustomHeaderButtons>
				<Item
					title='more'
					iconName='menu'
					onPress={this.goRoomActionsView}
					testID='room-view-header-actions'
				/>
			</CustomHeaderButtons>
		);
	}
}

export default RightButtonsContainer;
