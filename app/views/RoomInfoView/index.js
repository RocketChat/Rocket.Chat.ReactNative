import React from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, ScrollView, SafeAreaView
} from 'react-native';
import { connect, Provider } from 'react-redux';
import moment from 'moment';
import { Navigation } from 'react-native-navigation';

import LoggedView from '../View';
import Status from '../../containers/status';
import Avatar from '../../containers/Avatar';
import styles from './styles';
import sharedStyles from '../Styles';
import database from '../../lib/realm';
import RocketChat from '../../lib/rocketchat';

import log from '../../utils/log';
import RoomTypeIcon from '../../containers/RoomTypeIcon';
import I18n from '../../i18n';
import { iconsMap } from '../../Icons';
import store from '../../lib/createStore';

const PERMISSION_EDIT_ROOM = 'edit-room';

const camelize = str => str.replace(/^(.)/, (match, chr) => chr.toUpperCase());
const getRoomTitle = room => (room.t === 'd'
	? <Text testID='room-info-view-name' style={styles.roomTitle}>{room.fname}</Text>
	: (
		<View style={styles.roomTitleRow}>
			<RoomTypeIcon type={room.t} key='room-info-type' />
			<Text testID='room-info-view-name' style={styles.roomTitle} key='room-info-name'>{room.name}</Text>
		</View>
	)
);

let RoomInfoEditView = null;

@connect(state => ({
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	userId: state.login.user && state.login.user.id,
	activeUsers: state.activeUsers,
	Message_TimeFormat: state.settings.Message_TimeFormat,
	allRoles: state.roles
}))
/** @extends React.Component */
export default class RoomInfoView extends LoggedView {
	static propTypes = {
		navigator: PropTypes.object,
		rid: PropTypes.string,
		userId: PropTypes.string,
		baseUrl: PropTypes.string,
		activeUsers: PropTypes.object,
		Message_TimeFormat: PropTypes.string,
		allRoles: PropTypes.object
	}

	constructor(props) {
		super('RoomInfoView', props);
		const { rid } = props;
		this.rooms = database.objects('subscriptions').filtered('rid = $0', rid);
		this.sub = {
			unsubscribe: () => {}
		};
		this.state = {
			room: {},
			roomUser: {},
			roles: []
		};
		props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));
	}

	componentDidMount() {
		this.updateRoom();
		this.rooms.addListener(this.updateRoom);
	}

	componentWillUnmount() {
		this.rooms.removeAllListeners();
		this.sub.unsubscribe();
	}

	onNavigatorEvent(event) {
		const { rid, navigator } = this.props;
		if (event.type === 'NavBarButtonPress') {
			if (event.id === 'edit') {
				if (RoomInfoEditView == null) {
					RoomInfoEditView = require('../RoomInfoEditView').default;
					Navigation.registerComponent('RoomInfoEditView', () => RoomInfoEditView, store, Provider);
				}

				navigator.push({
					screen: 'RoomInfoEditView',
					title: I18n.t('Room_Info_Edit'),
					backButtonTitle: '',
					passProps: {
						rid
					}
				});
			}
		}
	}

	getFullUserData = async(username) => {
		try {
			const result = await RocketChat.subscribe('fullUserData', username);
			this.sub = result;
		} catch (e) {
			log('getFullUserData', e);
		}
	}

	isDirect = () => {
		const { room: { t } } = this.state;
		return t === 'd';
	}

	updateRoom = async() => {
		const { userId, activeUsers, navigator } = this.props;

		const [room] = this.rooms;
		this.setState({ room });

		// get user of room
		if (room) {
			if (room.t === 'd') {
				try {
					const roomUser = await RocketChat.getRoomMember(room.rid, userId);
					this.setState({ roomUser });
					const username = room.name;

					const activeUser = activeUsers[roomUser._id];
					if (!activeUser || !activeUser.utcOffset) {
						// get full user data looking for utcOffset
						// will be catched by .on('users) and saved on activeUsers reducer
						this.getFullUserData(username);
					}

					// get all users roles
					// needs to be changed by a better method
					const allUsersRoles = await RocketChat.getUserRoles();
					const userRoles = allUsersRoles.find(user => user.username === username);
					if (userRoles) {
						this.setState({ roles: userRoles.roles || [] });
					}
				} catch (e) {
					log('RoomInfoView.componentDidMount', e);
				}
			} else {
				const isVisible = await navigator.screenIsCurrentlyVisible();

				if (!isVisible) {
					return;
				}
				const permissions = RocketChat.hasPermission([PERMISSION_EDIT_ROOM], room.rid);
				if (permissions[PERMISSION_EDIT_ROOM]) {
					navigator.setButtons({
						rightButtons: [{
							id: 'edit',
							icon: iconsMap.create,
							testID: 'room-info-view-edit-button'
						}]
					});
				}
			}
		}
	}

	renderItem = (key, room) => (
		<View style={styles.item}>
			<Text style={styles.itemLabel}>{I18n.t(camelize(key))}</Text>
			<Text
				style={[styles.itemContent, !room[key] && styles.itemContent__empty]}
				testID={`room-info-view-${ key }`}
			>{ room[key] ? room[key] : I18n.t(`No_${ key }_provided`) }
			</Text>
		</View>
	);

	renderRoles = () => {
		const { roles } = this.state;
		const { allRoles } = this.props;

		return (
			roles.length > 0
				? (
					<View style={styles.item}>
						<Text style={styles.itemLabel}>{I18n.t('Roles')}</Text>
						<View style={styles.rolesContainer}>
							{roles.map(role => (
								<View style={styles.roleBadge} key={role}>
									<Text>{ allRoles[role] }</Text>
								</View>
							))}
						</View>
					</View>
				)
				: null
		);
	}

	renderTimezone = (userId) => {
		const { activeUsers, Message_TimeFormat } = this.props;

		if (activeUsers[userId]) {
			const { utcOffset } = activeUsers[userId];

			if (!utcOffset) {
				return null;
			}
			return (
				<View style={styles.item}>
					<Text style={styles.itemLabel}>{I18n.t('Timezone')}</Text>
					<Text style={styles.itemContent}>{moment().utcOffset(utcOffset).format(Message_TimeFormat)} (UTC { utcOffset })</Text>
				</View>
			);
		}
		return null;
	}

	renderAvatar = (room, roomUser) => {
		const { baseUrl } = this.props;

		return (
			<Avatar
				text={room.name}
				size={100}
				style={styles.avatar}
				type={room.t}
				baseUrl={baseUrl}
			>
				{room.t === 'd' ? <Status style={[sharedStyles.status, styles.status]} id={roomUser._id} /> : null}
			</Avatar>
		);
	}

	renderBroadcast = () => (
		<View style={styles.item}>
			<Text style={styles.itemLabel}>{I18n.t('Broadcast_Channel')}</Text>
			<Text
				style={styles.itemContent}
				testID='room-info-view-broadcast'
			>{I18n.t('Broadcast_channel_Description')}
			</Text>
		</View>
	)

	render() {
		const { room, roomUser } = this.state;
		if (!room) {
			return <View />;
		}
		return (
			<ScrollView style={styles.scroll}>
				<SafeAreaView style={styles.container} testID='room-info-view'>
					<View style={styles.avatarContainer}>
						{this.renderAvatar(room, roomUser)}
						<View style={styles.roomTitleContainer}>{ getRoomTitle(room) }</View>
					</View>
					{!this.isDirect() ? this.renderItem('description', room) : null}
					{!this.isDirect() ? this.renderItem('topic', room) : null}
					{!this.isDirect() ? this.renderItem('announcement', room) : null}
					{this.isDirect() ? this.renderRoles() : null}
					{this.isDirect() ? this.renderTimezone(roomUser._id) : null}
					{room.broadcast ? this.renderBroadcast() : null}
				</SafeAreaView>
			</ScrollView>
		);
	}
}
