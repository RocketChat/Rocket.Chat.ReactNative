import React from 'react';
import PropTypes from 'prop-types';
import { Alert } from 'react-native';
import { connect } from 'react-redux';
import ActionSheet from 'react-native-action-sheet';
import {
	actionsHide as actionsHideAction,
	hideRoom as hideRoomAction,
	markAsUnreadRequest as markAsUnreadRequestAction,
	toggleFavoriteRequest as toggleFavoriteRequestAction,
	leaveRoom as leaveRoomAction
} from '../actions/room';
import RocketChat from '../lib/rocketchat';
import I18n from '../i18n';

@connect(
	dispatch => ({
		actionsHide: () => dispatch(actionsHideAction()),
		hideRoom: rid => dispatch(hideRoomAction(rid)),
		markAsUnreadRequest: rid => dispatch(markAsUnreadRequestAction(rid)),
		toggleFavoriteRequest: rid => dispatch(toggleFavoriteRequestAction(rid)),
		leaveRoom: (rid, t) => dispatch(leaveRoomAction(rid, t))
	})
)
export default class RoomActions extends React.Component {
	static propTypes = {
		room: PropTypes.object.isRequired,
		actionsHide: PropTypes.func.isRequired,
		hideRoom: PropTypes.func.isRequired,
		markAsUnreadRequest: PropTypes.func.isRequired,
		toggleFavoriteRequest: PropTypes.func.isRequired,
		leaveRoom: PropTypes.func.isRequired,
		isRoomFavorite: PropTypes.bool.isRequired
	};

	constructor(props) {
		super(props);
		this.handleActionPress = this.handleActionPress.bind(this);
		this.setPermissions();

		const { isRoomFavorite } = this.props;

		// Cancel
		this.options = [I18n.t('Cancel')];
		this.CANCEL_INDEX = 0;

		// Mark As Unread
		this.options = [I18n.t('Mark_As_Unread')];
		this.MARK_AS_UNREAD_INDEX = this.options.length - 1;

		// Hide Room
		this.options.push(I18n.t('Hide_Room'));
		this.HIDE_ROOM_INDEX = this.options.length - 1;

		// Toggle Favorite
		if (isRoomFavorite) {
			this.options.push(I18n.t('Unfavorite'));
		} else {
			this.options.push(I18n.t('Favorite'));
		}
		this.TOGGLE_FAVORITE_INDEX = this.options.length - 1;

		// Leave Room
		if (this.hasLeavePermission) {
			this.options.push(I18n.t('Leave Room'));
			this.LEAVE_ROOM_INDEX = this.options.length - 1;
		}
	}

	setPermissions() {
		const { room } = this.props;
		const permissions = ['leave-c', 'leave-p'];
		const result = RocketChat.hasPermission(permissions, room.rid);
		const canLeaveChannel = room.t === 'c' && result[permissions[0]];
		const canLeaveGroup = room.t === 'p' && result[permissions[1]];
		this.hasLeavePermission = canLeaveChannel && canLeaveGroup;
	}

	handleHideRoom = () => {
		const { hideRoom, room } = this.props;
		Alert.alert(
			I18n.t('Are_you_sure_question_mark'),
			I18n.t('Hide_room_warning'),
			[
				{
					text: I18n.t('Cancel'),
					style: 'cancel'
				},
				{
					text: I18n.t('Yes_action_it', { action: 'hide' }),
					style: 'destructive',
					onPress: () => hideRoom(room.rid)
				}
			]
		);
	}

	handleMarkAsUnread = () => {
		const { markAsUnreadRequest, room } = this.props;
		markAsUnreadRequest(room.rid);
	}

	handleToggleFavorite = () => {
		const { toggleFavoriteRequest, room } = this.props;
		toggleFavoriteRequest(room.rid);
	}

	handleLeaveRoom = () => {
		const { leaveRoom, room } = this.props;
		Alert.alert(
			I18n.t('Are_you_sure_question_mark'),
			I18n.t('Are_you_sure_you_want_to_leave_the_room', { room: room.t === 'd' ? room.fname : room.name }),
			[
				{
					text: I18n.t('Cancel'),
					style: 'cancel'
				},
				{
					text: I18n.t('Yes_action_it', { action: 'leave' }),
					style: 'destructive',
					onPress: () => leaveRoom(room.rid, room.t)
				}
			]
		);
	}

	handleActionPress = (actionIndex) => {
		if (actionIndex) {
			switch (actionIndex) {
				case this.HIDE_ROOM_INDEX:
					this.handleHideRoom();
					break;
				case this.MARK_AS_UNREAD_INDEX:
					this.handleMarkAsUnread();
					break;
				case this.TOGGLE_FAVORITE_INDEX:
					this.handleToggleFavorite();
					break;
				case this.LEAVE_ROOM_INDEX:
					this.handleLeaveRoom();
					break;
				default:
					break;
			}
		}
		const { actionsHide } = this.props;
		actionsHide();
	}

	showActionSheet = () => {
		ActionSheet.showActionSheetWithOptions({
			options: this.options,
			cancelButtonIndex: this.CANCEL_INDEX
		});
	}

	render() {
		return (
			null
		);
	}
}
