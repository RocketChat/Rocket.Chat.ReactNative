import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, ScrollView } from 'react-native';
import { connect } from 'react-redux';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import moment from 'moment';

import Status from '../../containers/status';
import Avatar from '../../containers/Avatar';
import styles from './styles';
import sharedStyles from '../Styles';
import database from '../../lib/realm';
import RocketChat from '../../lib/rocketchat';
import Touch from '../../utils/touch';

const PERMISSION_EDIT_ROOM = 'edit-room';

const camelize = str => str.replace(/^(.)/, (match, chr) => chr.toUpperCase());

@connect(state => ({
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	user: state.login.user,
	permissions: state.permissions,
	activeUsers: state.activeUsers,
	Message_TimeFormat: state.settings.Message_TimeFormat,
	roles: state.roles
}))
export default class RoomInfoView extends React.Component {
	static propTypes = {
		baseUrl: PropTypes.string,
		user: PropTypes.object,
		navigation: PropTypes.object,
		activeUsers: PropTypes.object,
		Message_TimeFormat: PropTypes.string,
		roles: PropTypes.object
	}

	static navigationOptions = ({ navigation }) => {
		const params = navigation.state.params || {};
		if (!params.hasEditPermission) {
			return;
		}
		return {
			headerRight: (
				<Touch
					onPress={() => navigation.navigate('RoomInfoEdit', { rid: navigation.state.params.rid })}
					underlayColor='#ffffff'
					activeOpacity={0.5}
					accessibilityLabel='edit'
					accessibilityTraits='button'
				>
					<View style={styles.headerButton}>
						<MaterialIcon name='edit' size={20} />
					</View>
				</Touch>
			)
		};
	};

	constructor(props) {
		super(props);
		const { rid } = props.navigation.state.params;
		this.rooms = database.objects('subscriptions').filtered('rid = $0', rid);
		this.sub = {
			unsubscribe: () => {}
		};
		this.state = {
			room: {},
			roomUser: {},
			roles: []
		};
	}

	async componentDidMount() {
		await this.updateRoom();
		this.rooms.addListener(this.updateRoom);

		// get user of room
		if (this.state.room.t === 'd') {
			try {
				const roomUser = await RocketChat.getRoomMember(this.state.room.rid, this.props.user.id);
				this.setState({ roomUser });
				const username = this.state.room.name;

				const activeUser = this.props.activeUsers[roomUser._id];
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
			} catch (error) {
				alert(error);
			}
		} else {
			const permissions = RocketChat.hasPermission([PERMISSION_EDIT_ROOM], this.state.room.rid);
			this.props.navigation.setParams({ hasEditPermission: permissions[PERMISSION_EDIT_ROOM] });
		}
	}

	componentWillUnmount() {
		this.rooms.removeAllListeners();
		this.sub.unsubscribe();
	}

	getFullUserData = async(username) => {
		const result = await RocketChat.subscribe('fullUserData', username);
		this.sub = result;
	}

	getRoomTitle = room => (room.t === 'd' ? room.fname : room.name);

	isDirect = () => this.state.room.t === 'd';

	updateRoom = async() => {
		const [room] = this.rooms;
		this.setState({ room });
	}
	// TODO: translate
	renderItem = (key, room) => (
		<View style={styles.item}>
			<Text style={styles.itemLabel}>{camelize(key)}</Text>
			<Text style={[styles.itemContent, !room[key] && styles.itemContent__empty]}>{ room[key] ? room[key] : `No ${ key } provided.` }</Text>
		</View>
	);

	renderRoles = () => (
		this.state.roles.length > 0 &&
		<View style={styles.item}>
			<Text style={styles.itemLabel}>Roles</Text>
			<View style={styles.rolesContainer}>
				{this.state.roles.map(role => (
					<View style={styles.roleBadge} key={role}>
						<Text>{ this.props.roles[role] }</Text>
					</View>
				))}
			</View>
		</View>
	)

	renderTimezone = (userId) => {
		if (this.props.activeUsers[userId]) {
			const { utcOffset } = this.props.activeUsers[userId];

			if (!utcOffset) {
				return null;
			}
			// TODO: translate
			return (
				<View style={styles.item}>
					<Text style={styles.itemLabel}>Timezone</Text>
					<Text style={styles.itemContent}>{moment().utcOffset(utcOffset).format(this.props.Message_TimeFormat)} (UTC { utcOffset })</Text>
				</View>
			);
		}
		return null;
	}

	render() {
		const { room, roomUser } = this.state;
		const { name, t } = room;
		return (
			<ScrollView style={styles.container}>
				<View style={styles.avatarContainer}>
					<Avatar
						text={name}
						size={100}
						style={styles.avatar}
						baseUrl={this.props.baseUrl}
						type={t}
					>
						{t === 'd' ? <Status style={[sharedStyles.status, styles.status]} id={roomUser._id} /> : null}
					</Avatar>
					<Text style={styles.roomTitle}>{ this.getRoomTitle(room) }</Text>
				</View>

				{!this.isDirect() && this.renderItem('description', room)}
				{!this.isDirect() && this.renderItem('topic', room)}
				{!this.isDirect() && this.renderItem('announcement', room)}
				{this.isDirect() && this.renderRoles()}
				{this.isDirect() && this.renderTimezone(roomUser._id)}
			</ScrollView>
		);
	}
}
