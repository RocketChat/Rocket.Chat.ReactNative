import React from 'react';
import PropTypes from 'prop-types';
import { Alert, Share } from 'react-native';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';

import { leaveRoom as leaveRoomAction } from '../../actions/room';
import RocketChat from '../../lib/rocketchat';
import log from '../../utils/log';
import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import ActionsList from './ActionsList';

import styles from './styles';

class RoomActionsView extends React.Component {
	static navigationOptions = {
		title: I18n.t('Actions')
	}

	static propTypes = {
		baseUrl: PropTypes.string,
		navigation: PropTypes.object,
		user: PropTypes.shape({
			id: PropTypes.string,
			token: PropTypes.string
		}),
		leaveRoom: PropTypes.func,
		jitsiEnabled: PropTypes.bool
	}

	constructor(props) {
		super(props);
		this.mounted = false;
		const room = props.navigation.getParam('room');
		this.rid = props.navigation.getParam('rid');
		this.t = props.navigation.getParam('t');
		this.state = {
			room: room || { rid: this.rid, t: this.t },
			membersCount: 0,
			member: {},
			joined: !!room,
			canViewMembers: false,
			canAutoTranslate: false,
			canAddUser: false
		};
		if (room && room.observe) {
			this.roomObservable = room.observe();
			this.subscription = this.roomObservable
				.subscribe((changes) => {
					if (this.mounted) {
						this.setState({ room: changes });
					} else {
						this.state.room = changes;
					}
				});
		}
	}

	async componentDidMount() {
		this.mounted = true;
		const { room } = this.state;
		if (!room.id) {
			try {
				const result = await RocketChat.getChannelInfo(room.rid);
				if (result.success) {
					this.setState({ room: { ...result.channel, rid: result.channel._id } });
				}
			} catch (e) {
				log(e);
			}
		}

		if (room && room.t !== 'd' && this.canViewMembers()) {
			try {
				const counters = await RocketChat.getRoomCounters(room.rid, room.t);
				if (counters.success) {
					this.setState({ membersCount: counters.members, joined: counters.joined });
				}
			} catch (e) {
				log(e);
			}
		} else if (room.t === 'd') {
			this.updateRoomMember();
		}

		const canAutoTranslate = await RocketChat.canAutoTranslate();
		this.setState({ canAutoTranslate });

		this.canAddUser();
	}

	componentWillUnmount() {
		if (this.subscription && this.subscription.unsubscribe) {
			this.subscription.unsubscribe();
		}
	}

	onPressTouchable = (item) => {
		if (item.route) {
			const { navigation } = this.props;
			navigation.navigate(item.route, item.params);
		}
		if (item.event) {
			return item.event();
		}
	}

	// TODO: move to componentDidMount
	// eslint-disable-next-line react/sort-comp
	canAddUser = async() => {
		const { room, joined } = this.state;
		const { rid, t } = room;
		let canAdd = false;

		const userInRoom = joined;
		const permissions = await RocketChat.hasPermission(['add-user-to-joined-room', 'add-user-to-any-c-room', 'add-user-to-any-p-room'], rid);

		if (permissions) {
			if (userInRoom && permissions['add-user-to-joined-room']) {
				canAdd = true;
			}
			if (t === 'c' && permissions['add-user-to-any-c-room']) {
				canAdd = true;
			}
			if (t === 'p' && permissions['add-user-to-any-p-room']) {
				canAdd = true;
			}
		}
		this.setState({ canAddUser: canAdd });
	}

	// TODO: move to componentDidMount
	// eslint-disable-next-line react/sort-comp
	canViewMembers = async() => {
		const { room } = this.state;
		const { rid, t, broadcast } = room;
		if (broadcast) {
			const viewBroadcastMemberListPermission = 'view-broadcast-member-list';
			const permissions = await RocketChat.hasPermission([viewBroadcastMemberListPermission], rid);
			if (!permissions[viewBroadcastMemberListPermission]) {
				return false;
			}
		}

		// This method is executed only in componentDidMount and returns a value
		// We save the state to read in render
		const result = (t === 'c' || t === 'p');
		this.setState({ canViewMembers: result });
		return result;
	}

	updateRoomMember = async() => {
		const { room } = this.state;
		const { rid } = room;
		const { user } = this.props;

		try {
			const roomUserId = RocketChat.getRoomMemberId(rid, user.id);
			const result = await RocketChat.getUserInfo(roomUserId);
			if (result.success) {
				this.setState({ member: result.user });
			}
		} catch (e) {
			log(e);
			this.setState({ member: {} });
		}
	}

	toggleBlockUser = () => {
		const { room } = this.state;
		const { rid, blocker } = room;
		const { member } = this.state;
		try {
			RocketChat.toggleBlockUser(rid, member._id, !blocker);
		} catch (e) {
			log(e);
		}
	}

	handleShare = () => {
		const { room } = this.state;
		const permalink = RocketChat.getPermalinkChannel(room);
		Share.share({
			message: permalink
		});
	};

	leaveChannel = () => {
		const { room } = this.state;
		const { leaveRoom } = this.props;

		Alert.alert(
			I18n.t('Are_you_sure_question_mark'),
			I18n.t('Are_you_sure_you_want_to_leave_the_room', { room: room.t === 'd' ? room.fname : room.name }),
			[
				{
					text: I18n.t('Cancel'),
					style: 'cancel'
				},
				{
					text: I18n.t('Yes_action_it', { action: I18n.t('leave') }),
					style: 'destructive',
					onPress: () => leaveRoom(room.rid, room.t)
				}
			]
		);
	}

	render() {
		const {
			room, member, membersCount, canViewMembers, canAddUser, joined, canAutoTranslate
		} = this.state;
		const {
			baseUrl, jitsiEnabled, user, navigation
		} = this.props;

		return (
			<SafeAreaView
				style={styles.container}
				testID='room-actions-view'
				forceInset={{ vertical: 'never' }}
			>
				<StatusBar />
				<ActionsList
					room={room}
					baseUrl={baseUrl}
					user={user}
					member={member}
					membersCount={membersCount}
					canViewMembers={canViewMembers}
					canAddUser={canAddUser}
					joined={joined}
					canAutoTranslate={canAutoTranslate}
					jitsiEnabled={jitsiEnabled}
					handleShare={this.handleShare}
					toggleBlockUser={this.toggleBlockUser}
					leaveChannel={this.leaveChannel}
					navigation={navigation}
				/>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	user: {
		id: state.login.user && state.login.user.id,
		token: state.login.user && state.login.user.token
	},
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	jitsiEnabled: state.settings.Jitsi_Enabled || false
});

const mapDispatchToProps = dispatch => ({
	leaveRoom: (rid, t) => dispatch(leaveRoomAction(rid, t))
});

export default connect(mapStateToProps, mapDispatchToProps)(RoomActionsView);
