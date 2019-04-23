import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, ScrollView } from 'react-native';
import { connect } from 'react-redux';
import moment from 'moment';
import { SafeAreaView } from 'react-navigation';
import equal from 'deep-equal';

import LoggedView from '../View';
import Status from '../../containers/Status';
import Avatar from '../../containers/Avatar';
import styles from './styles';
import sharedStyles from '../Styles';
import database, { safeAddListener } from '../../lib/realm';
import RocketChat from '../../lib/rocketchat';
import log from '../../utils/log';
import RoomTypeIcon from '../../containers/RoomTypeIcon';
import I18n from '../../i18n';
import { CustomHeaderButtons, Item } from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';

const PERMISSION_EDIT_ROOM = 'edit-room';

const camelize = str => str.replace(/^(.)/, (match, chr) => chr.toUpperCase());
const getRoomTitle = room => (room.t === 'd'
	? <Text testID='room-info-view-name' style={styles.roomTitle}>{room.fname}</Text>
	: (
		<View style={styles.roomTitleRow}>
			<RoomTypeIcon type={room.prid ? 'discussion' : room.t} key='room-info-type' />
			<Text testID='room-info-view-name' style={styles.roomTitle} key='room-info-name'>{room.prid ? room.fname : room.name}</Text>
		</View>
	)
);

@connect(state => ({
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	user: {
		id: state.login.user && state.login.user.id,
		token: state.login.user && state.login.user.token
	},
	activeUsers: state.activeUsers, // TODO: remove it
	Message_TimeFormat: state.settings.Message_TimeFormat,
	allRoles: state.roles
}))
/** @extends React.Component */
export default class RoomInfoView extends LoggedView {
	static navigationOptions = ({ navigation }) => {
		const showEdit = navigation.getParam('showEdit');
		const rid = navigation.getParam('rid');
		return {
			title: I18n.t('Room_Info'),
			headerRight: showEdit
				? (
					<CustomHeaderButtons>
						<Item iconName='edit' onPress={() => navigation.navigate('RoomInfoEditView', { rid })} testID='room-info-view-edit-button' />
					</CustomHeaderButtons>
				)
				: null
		};
	}

	static propTypes = {
		navigation: PropTypes.object,
		user: PropTypes.shape({
			id: PropTypes.string,
			token: PropTypes.string
		}),
		baseUrl: PropTypes.string,
		activeUsers: PropTypes.object,
		Message_TimeFormat: PropTypes.string,
		allRoles: PropTypes.object
	}

	constructor(props) {
		super('RoomInfoView', props);
		const rid = props.navigation.getParam('rid');
		const room = props.navigation.getParam('room');
		this.rooms = database.objects('subscriptions').filtered('rid = $0', rid);
		this.sub = {
			unsubscribe: () => {}
		};
		this.state = {
			room: this.rooms[0] || room || {},
			roomUser: {},
			roles: []
		};
	}

	async componentDidMount() {
		safeAddListener(this.rooms, this.updateRoom);
		const { room } = this.state;
		const permissions = RocketChat.hasPermission([PERMISSION_EDIT_ROOM], room.rid);
		if (permissions[PERMISSION_EDIT_ROOM] && !room.prid) {
			const { navigation } = this.props;
			navigation.setParams({ showEdit: true });
		}

		// get user of room
		if (room) {
			if (room.t === 'd') {
				try {
					const { user, activeUsers } = this.props;
					const roomUser = await RocketChat.getRoomMember(room.rid, user.id);
					this.setState({ roomUser: roomUser || {} });
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
					const userRoles = allUsersRoles.find(u => u.username === username);
					if (userRoles) {
						this.setState({ roles: userRoles.roles || [] });
					}
				} catch (e) {
					log('RoomInfoView.componentDidMount', e);
				}
			}
		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		const {
			room, roomUser, roles
		} = this.state;
		const { activeUsers } = this.props;
		if (!equal(nextState.room, room)) {
			return true;
		}
		if (!equal(nextState.roomUser, roomUser)) {
			return true;
		}
		if (!equal(nextState.roles, roles)) {
			return true;
		}
		if (roomUser._id) {
			if (nextProps.activeUsers[roomUser._id] !== activeUsers[roomUser._id]) {
				return true;
			}
		}
		return false;
	}

	componentWillUnmount() {
		this.rooms.removeAllListeners();
		this.sub.unsubscribe();
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

	updateRoom = () => {
		if (this.rooms.length > 0) {
			this.setState({ room: JSON.parse(JSON.stringify(this.rooms[0])) });
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
									<Text style={styles.role}>{ allRoles[role] }</Text>
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
		const { baseUrl, user } = this.props;

		return (
			<Avatar
				text={room.name}
				size={100}
				style={styles.avatar}
				type={room.t}
				baseUrl={baseUrl}
				userId={user.id}
				token={user.token}
			>
				{room.t === 'd' ? <Status style={[sharedStyles.status, styles.status]} size={24} id={roomUser._id} /> : null}
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

	renderCustomFields = (userId) => {
		const { activeUsers } = this.props;
		if (activeUsers[userId]) {
			const { customFields } = activeUsers[userId];

			if (!customFields) {
				return null;
			}

			return (
				Object.keys(customFields).map((title) => {
					if (!customFields[title]) {
						return;
					}
					return (
						<View style={styles.item} key={title}>
							<Text style={styles.itemLabel}>{title}</Text>
							<Text style={styles.itemContent}>{customFields[title]}</Text>
						</View>
					);
				})
			);
		}
		return null;
	}

	render() {
		const { room, roomUser } = this.state;
		if (!room) {
			return <View />;
		}
		return (
			<ScrollView style={styles.scroll}>
				<StatusBar />
				<SafeAreaView style={styles.container} testID='room-info-view' forceInset={{ bottom: 'never' }}>
					<View style={styles.avatarContainer}>
						{this.renderAvatar(room, roomUser)}
						<View style={styles.roomTitleContainer}>{ getRoomTitle(room) }</View>
					</View>
					{!this.isDirect() ? this.renderItem('description', room) : null}
					{!this.isDirect() ? this.renderItem('topic', room) : null}
					{!this.isDirect() ? this.renderItem('announcement', room) : null}
					{this.isDirect() ? this.renderRoles() : null}
					{this.isDirect() ? this.renderTimezone(roomUser._id) : null}
					{this.isDirect() ? this.renderCustomFields(roomUser._id) : null}
					{room.broadcast ? this.renderBroadcast() : null}
				</SafeAreaView>
			</ScrollView>
		);
	}
}
