import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, ScrollView } from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';
import { connect } from 'react-redux';
import UAParser from 'ua-parser-js';
import isEmpty from 'lodash/isEmpty';

import database from '../../lib/database';
import { CustomIcon } from '../../lib/Icons';
import Status from '../../containers/Status';
import Avatar from '../../containers/Avatar';
import styles from './styles';
import sharedStyles from '../Styles';
import RocketChat from '../../lib/rocketchat';
import RoomTypeIcon from '../../containers/RoomTypeIcon';
import I18n from '../../i18n';
import * as HeaderButton from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import log, { logEvent, events } from '../../utils/log';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import Markdown from '../../containers/markdown';
import { LISTENER } from '../../containers/Toast';
import EventEmitter from '../../utils/events';

import Livechat from './Livechat';
import Channel from './Channel';
import Direct from './Direct';
import SafeAreaView from '../../containers/SafeAreaView';
import { goRoom } from '../../utils/goRoom';
import Navigation from '../../lib/Navigation';

const getRoomTitle = (room, type, name, username, statusText, theme) => (type === 'd'
	? (
		<>
			<Text testID='room-info-view-name' style={[styles.roomTitle, { color: themes[theme].titleText }]}>{ name }</Text>
			{username && <Text testID='room-info-view-username' style={[styles.roomUsername, { color: themes[theme].auxiliaryText }]}>{`@${ username }`}</Text>}
			{!!statusText && <View testID='room-info-view-custom-status'><Markdown msg={statusText} style={[styles.roomUsername, { color: themes[theme].auxiliaryText }]} preview theme={theme} /></View>}
		</>
	)
	: (
		<View style={styles.roomTitleRow}>
			<RoomTypeIcon type={room.prid ? 'discussion' : room.t} teamMain={room.teamMain} key='room-info-type' status={room.visitor?.status} />
			<Text testID='room-info-view-name' style={[styles.roomTitle, { color: themes[theme].titleText }]} key='room-info-name'>{RocketChat.getRoomTitle(room)}</Text>
		</View>
	)
);

class RoomInfoView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object,
		route: PropTypes.object,
		rooms: PropTypes.array,
		theme: PropTypes.string,
		isMasterDetail: PropTypes.bool,
		jitsiEnabled: PropTypes.bool,
		editRoomPermission: PropTypes.array
	}

	constructor(props) {
		super(props);
		const room = props.route.params?.room;
		const roomUser = props.route.params?.member;
		this.rid = props.route.params?.rid;
		this.t = props.route.params?.t;
		this.state = {
			room: room || { rid: this.rid, t: this.t },
			roomUser: roomUser || {},
			showEdit: false
		};
	}

	componentDidMount() {
		if (this.isDirect) {
			this.loadUser();
		} else {
			this.loadRoom();
		}
		this.setHeader();

		const { navigation } = this.props;
		this.unsubscribeFocus = navigation.addListener('focus', () => {
			if (this.isLivechat) {
				this.loadVisitor();
			}
		});
	}

	componentWillUnmount() {
		if (this.subscription && this.subscription.unsubscribe) {
			this.subscription.unsubscribe();
		}
		if (this.unsubscribeFocus) {
			this.unsubscribeFocus();
		}
	}

	setHeader = () => {
		const { roomUser, room, showEdit } = this.state;
		const { navigation, route } = this.props;
		const t = route.params?.t;
		const rid = route.params?.rid;
		const showCloseModal = route.params?.showCloseModal;
		navigation.setOptions({
			headerLeft: showCloseModal ? () => <HeaderButton.CloseModal navigation={navigation} /> : undefined,
			title: t === 'd' ? I18n.t('User_Info') : I18n.t('Room_Info'),
			headerRight: showEdit
				? () => (
					<HeaderButton.Container>
						<HeaderButton.Item
							iconName='edit'
							onPress={() => {
								const isLivechat = t === 'l';
								logEvent(events[`RI_GO_${ isLivechat ? 'LIVECHAT' : 'RI' }_EDIT`]);
								navigation.navigate(isLivechat ? 'LivechatEditView' : 'RoomInfoEditView', { rid, room, roomUser });
							}}
							testID='room-info-view-edit-button'
						/>
					</HeaderButton.Container>
				)
				: null
		});
	}

	get isDirect() {
		const { room } = this.state;
		return room.t === 'd';
	}

	get isLivechat() {
		const { room } = this.state;
		return room.t === 'l';
	}

	getRoleDescription = async(id) => {
		const db = database.active;
		try {
			const rolesCollection = db.get('roles');
			const role = await rolesCollection.find(id);
			if (role) {
				return role.description;
			}
			return null;
		} catch (e) {
			return null;
		}
	};

	loadVisitor = async() => {
		const { room } = this.state;
		try {
			const result = await RocketChat.getVisitorInfo(room?.visitor?._id);
			if (result.success) {
				const { visitor } = result;
				if (visitor.userAgent) {
					const ua = new UAParser();
					ua.setUA(visitor.userAgent);
					visitor.os = `${ ua.getOS().name } ${ ua.getOS().version }`;
					visitor.browser = `${ ua.getBrowser().name } ${ ua.getBrowser().version }`;
				}
				this.setState({ roomUser: visitor }, () => this.setHeader());
			}
		} catch (error) {
			// Do nothing
		}
	}

	loadUser = async() => {
		const { room, roomUser } = this.state;

		if (isEmpty(roomUser)) {
			try {
				const roomUserId = RocketChat.getUidDirectMessage(room);
				const result = await RocketChat.getUserInfo(roomUserId);
				if (result.success) {
					const { user } = result;
					const { roles } = user;
					if (roles && roles.length) {
						user.parsedRoles = await Promise.all(roles.map(async(role) => {
							const description = await this.getRoleDescription(role);
							return description;
						}));
					}

					this.setState({ roomUser: user });
				}
			} catch {
				// do nothing
			}
		}
	}

	loadRoom = async() => {
		const { room: roomState } = this.state;
		const { route, editRoomPermission } = this.props;
		let room = route.params?.room;
		if (room && room.observe) {
			this.roomObservable = room.observe();
			this.subscription = this.roomObservable
				.subscribe((changes) => {
					this.setState({ room: changes }, () => this.setHeader());
				});
		} else {
			try {
				const result = await RocketChat.getRoomInfo(this.rid);
				if (result.success) {
					({ room } = result);
					this.setState({ room: { ...roomState, ...room } });
				}
			} catch (e) {
				log(e);
			}
		}

		const permissions = await RocketChat.hasPermission([editRoomPermission], room.rid);
		if (permissions[0]) {
			this.setState({ showEdit: true }, () => this.setHeader());
		}
	}

	createDirect = () => new Promise(async(resolve, reject) => {
		const { route } = this.props;

		// We don't need to create a direct
		const member = route.params?.member;
		if (!isEmpty(member)) {
			return resolve();
		}

		// TODO: Check if some direct with the user already exists on database
		try {
			const { roomUser: { username } } = this.state;
			const result = await RocketChat.createDirectMessage(username);
			if (result.success) {
				const { room: { rid } } = result;
				return this.setState(({ room }) => ({ room: { ...room, rid } }), resolve);
			}
		} catch {
			// do nothing
		}
		reject();
	})

	goRoom = () => {
		logEvent(events.RI_GO_ROOM_USER);
		const { roomUser, room } = this.state;
		const { name, username } = roomUser;
		const { rooms, navigation, isMasterDetail } = this.props;
		const params = {
			rid: room.rid,
			name: RocketChat.getRoomTitle({
				t: room.t,
				fname: name,
				name: username
			}),
			t: room.t,
			roomUserId: RocketChat.getUidDirectMessage(room)
		};

		if (room.rid) {
			// if it's on master detail layout, we close the modal and replace RoomView
			if (isMasterDetail) {
				Navigation.navigate('DrawerNavigator');
				goRoom({ item: params, isMasterDetail });
			} else {
				let navigate = navigation.push;
				// if this is a room focused
				if (rooms.includes(room.rid)) {
					({ navigate } = navigation);
				}
				navigate('RoomView', params);
			}
		}
	}

	videoCall = () => {
		const { room } = this.state;
		RocketChat.callJitsi(room);
	}

	renderAvatar = (room, roomUser) => {
		const { theme } = this.props;

		return (
			<Avatar
				text={room.name || roomUser.username}
				style={styles.avatar}
				type={this.t}
				size={100}
				rid={room?.rid}
			>
				{this.t === 'd' && roomUser._id
					? (
						<View style={[sharedStyles.status, { backgroundColor: themes[theme].auxiliaryBackground }]}>
							<Status size={20} id={roomUser._id} />
						</View>
					)
					: null}
			</Avatar>
		);
	}

	renderButton = (onPress, iconName, text) => {
		const { theme } = this.props;

		const onActionPress = async() => {
			try {
				if (this.isDirect) {
					await this.createDirect();
				}
				onPress();
			} catch {
				EventEmitter.emit(LISTENER, { message: I18n.t('error-action-not-allowed', { action: I18n.t('Create_Direct_Messages') }) });
			}
		};

		return (
			<BorderlessButton
				onPress={onActionPress}
				style={styles.roomButton}
			>
				<CustomIcon
					name={iconName}
					size={30}
					color={themes[theme].actionTintColor}
				/>
				<Text style={[styles.roomButtonText, { color: themes[theme].actionTintColor }]}>{text}</Text>
			</BorderlessButton>
		);
	}

	renderButtons = () => {
		const { jitsiEnabled } = this.props;
		return (
			<View style={styles.roomButtonsContainer}>
				{this.renderButton(this.goRoom, 'message', I18n.t('Message'))}
				{jitsiEnabled && this.isDirect ? this.renderButton(this.videoCall, 'camera', I18n.t('Video_call')) : null}
			</View>
		);
	}

	renderContent = () => {
		const { room, roomUser } = this.state;
		const { theme } = this.props;

		if (this.isDirect) {
			return <Direct roomUser={roomUser} theme={theme} />;
		} else if (this.t === 'l') {
			return <Livechat room={room} roomUser={roomUser} theme={theme} />;
		}
		return <Channel room={room} theme={theme} />;
	}

	render() {
		const { room, roomUser } = this.state;
		const { theme } = this.props;
		return (
			<ScrollView style={[styles.scroll, { backgroundColor: themes[theme].backgroundColor }]}>
				<StatusBar />
				<SafeAreaView
					style={{ backgroundColor: themes[theme].backgroundColor }}
					testID='room-info-view'
				>
					<View style={[styles.avatarContainer, { backgroundColor: themes[theme].auxiliaryBackground }]}>
						{this.renderAvatar(room, roomUser)}
						<View style={styles.roomTitleContainer}>{ getRoomTitle(room, this.t, roomUser?.name, roomUser?.username, roomUser?.statusText, theme) }</View>
						{this.renderButtons()}
					</View>
					{this.renderContent()}
				</SafeAreaView>
			</ScrollView>
		);
	}
}

const mapStateToProps = state => ({
	rooms: state.room.rooms,
	isMasterDetail: state.app.isMasterDetail,
	jitsiEnabled: state.settings.Jitsi_Enabled || false,
	editRoomPermission: state.permissions['edit-room']
});

export default connect(mapStateToProps)(withTheme(RoomInfoView));
