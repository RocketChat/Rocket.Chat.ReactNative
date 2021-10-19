import React from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, ScrollView, Alert, Modal, Pressable
} from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';
import { connect } from 'react-redux';
import UAParser from 'ua-parser-js';
import _ from 'lodash';
import Button from '../../containers/Button';
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
import log, { events, logEvent } from '../../utils/log';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import { getUserSelector } from '../../selectors/login';
import Markdown from '../../containers/markdown';
import { LISTENER } from '../../containers/Toast';
import EventEmitter from '../../utils/events';

import Livechat from './Livechat';
import Channel from './Channel';
import Direct from './Direct';
import SafeAreaView from '../../containers/SafeAreaView';
import { goRoom } from '../../utils/goRoom';
import Navigation from '../../lib/Navigation';
import { showErrorAlert } from '../../utils/info';


const PERMISSION_EDIT_ROOM = 'edit-room';
const getRoomTitle = (room, type, name, username, age, statusText, theme) => (type === 'd'
	? (
		<>
			<Text testID='room-info-view-name' style={[styles.roomTitle, { color: themes[theme].titleText }]}>{`${ name }, ${ age }`}</Text>
			{username && <Text testID='room-info-view-username' style={[styles.roomUsername, { color: themes[theme].auxiliaryText }]} />}
			{!!statusText && <View testID='room-info-view-custom-status'><Markdown msg={statusText} style={[styles.roomUsername, { color: themes[theme].auxiliaryText }]} preview theme={theme} /></View>}
		</>
	)
	: (
		<View style={styles.roomTitleRow}>
			<RoomTypeIcon type={room.prid ? 'discussion' : room.t} key='room-info-type' status={room.visitor?.status} theme={theme} />
			<Text testID='room-info-view-name' style={[styles.roomTitle, { color: themes[theme].titleText }]} key='room-info-name'>{RocketChat.getRoomTitle(room)}</Text>
		</View>
	)
);

class RoomInfoView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object,
		route: PropTypes.object,
		user: PropTypes.shape({
			id: PropTypes.string,
			token: PropTypes.string,
			customFields: PropTypes.object,
			roles: PropTypes.arrayOf(PropTypes.string)
		}),
		baseUrl: PropTypes.string,
		rooms: PropTypes.array,
		theme: PropTypes.string,
		isMasterDetail: PropTypes.bool,
		jitsiEnabled: PropTypes.bool
	}

	constructor(props) {
		super(props);
		const room = props.route.params?.room;
		const roomUser = props.route.params?.member;
		this.rid = props.route.params?.rid;
		this.t = props.route.params?.t;
		this.isPeerSupporter = props.route?.isPeerSupporter;
		this.state = {
			saving: false,
			room: room || { rid: this.rid, t: this.t },
			roomUser: roomUser || {},
			showEdit: false,
			modalVisible: false,
			connectButton: false
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
		const { navigation, route, theme } = this.props;
		const t = route.params?.t;
		const rid = route.params?.rid;
		const showCloseModal = route.params?.showCloseModal;
		navigation.setOptions({
			headerLeft: showCloseModal ? () => <HeaderButton.CloseModal navigation={navigation} testID='room-info-view' /> : undefined,
			title: t === 'd' ? I18n.t('Profile') : I18n.t('Room_Info'),
			headerRight: showEdit
				? () => (
					<HeaderButton.Item
						iconName='edit'
						onPress={() => {
							const isLivechat = t === 'l';
							logEvent(events[`RI_GO_${ isLivechat ? 'LIVECHAT' : 'RI' }_EDIT`]);
							navigation.navigate(isLivechat ? 'LivechatEditView' : 'RoomInfoEditView', { rid, room, roomUser });
						}}
						testID='room-info-view-edit-button'
					/>
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
			const rolesCollection = db.collections.get('roles');
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

		if (_.isEmpty(roomUser)) {
			try {
				const roomUserId = RocketChat.getUidDirectMessage(room);

				const result = await RocketChat.getUserInfo(roomUserId);

				if (result.success) {
					const { user } = result;
					const { roles } = user;
					if (roles && roles.length) {
						user.parsedRoles = await Promise.all(roles.map(role => this.getRoleDescription(role)));
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
		const { route } = this.props;
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

		const permissions = await RocketChat.hasPermission([PERMISSION_EDIT_ROOM], room.rid);
		if (permissions[PERMISSION_EDIT_ROOM] && !room.prid) {
			this.setState({ showEdit: true }, () => this.setHeader());
		}
	}

	createDirect = () => new Promise(async(resolve, reject) => {
		const { route } = this.props;

		// We don't need to create a direct
		const member = route.params?.member;
		if (!_.isEmpty(member)) {
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

	setModalVisible = (visible) => {
		this.setState({ modalVisible: visible });
	  }

	connect = async() => {
		const { user } = this.props;
		const { roomUser } = this.state;
		const { username } = roomUser;

		if (user !== null && user.customFields !== undefined && user.customFields !== null) {
			user.customFields.ConnectIds = user.customFields.ConnectIds === undefined || user.customFields.ConnectIds === ''
				? username
				: `${ user.customFields.ConnectIds },${ username }`;
		}

		try {
			const result = await RocketChat.saveUserProfile({}, user.customFields);
			 this.setModalVisible(true);
		} catch (e) {
			showErrorAlert(e.message, I18n.t('Oops'));
		}
	}

	message = async() => {
		try {
			await this.createDirect();
			this.goRoom();
		} catch (error) {
			EventEmitter.emit(LISTENER, { message: I18n.t('error-action-not-allowed', { action: I18n.t('Create_Direct_Messages') }) });
		}
	}

	videoCall = () => {
		const { room } = this.state;
		RocketChat.callJitsi(room.rid);
	}

	renderAvatar = (room, roomUser) => {
		const { baseUrl, user, theme } = this.props;

		let isPeerSupporter = false;
		let embedVideoUrl = 'https://www.youtube.com/embed/';
		const videoUrl = roomUser?.customFields?.VideoUrl;
		const id = videoUrl?.split('/')[3];
		embedVideoUrl = embedVideoUrl.concat(id);
		if (roomUser !== null
			&& roomUser !== undefined
			&& roomUser.parsedRoles !== null
			&& roomUser.parsedRoles !== undefined) {
			isPeerSupporter = roomUser.parsedRoles.indexOf('Peer Supporter') > -1;
		}

		if (isPeerSupporter) {
			return roomUser.customFields.VideoUrl ? (
				<View style={{
					width: 240,
					height: 240
				}}
				>
					<Avatar
						borderBottomRightRadius={80}
						borderRadius={20}
						text={room.name || roomUser.username}
						size={200}
						style={styles.avatar}
						type={this.t}
						baseUrl={baseUrl}
						userId={user.id}
						token={user.token}
					>
						{this.t === 'd' && roomUser._id ? (
							<CustomIcon
								style={{ left: 150, position: 'absolute', top: 150 }}
								name='play-filled'
								size={60}
								color='#8FCEA7'
								onPress={() => Navigation.navigate('VideoPlayerView', { videoUrl: `${ embedVideoUrl }` })
								}
							/>
						) : null}
					</Avatar>
				</View>
			) : (
				<View style={{
					width: 240,
					height: 240
				}}
				>
					<Avatar
						borderRadius={20}
						text={room.name || roomUser.username}
						size={200}
						style={styles.avatar}
						type={this.t}
						baseUrl={baseUrl}
						userId={user.id}
						token={user.token}
					/>
				</View>
			);
		} else {
			return	(
				<Avatar
					text={room.name || roomUser.username}
					size={100}
					style={styles.avatar}
					type={this.t}
					baseUrl={baseUrl}
					userId={user.id}
					token={user.token}

				>
					{this.t === 'd' && roomUser._id ? <Status style={[sharedStyles.status, styles.status]} theme={theme} size={24} id={roomUser._id} /> : null}
				</Avatar>
			);
		}
	}

	renderModal = () => {
		const { modalVisible, roomUser } = this.state;
		return	(
			<Modal
				animationType='slide'
				transparent
				visible={modalVisible}
				onRequestClose={() => {
		  Alert.alert('Modal has been closed.');
		  this.setModalVisible(!modalVisible);
				}}
			><View style={styles.centeredView}>
				<View style={styles.modalView}>
						<Text style={styles.modalText}>Get the conversation started!</Text>
						<Text style={styles.modalText}>Introduce yourself to your new peer supporter!</Text>
						<Pressable
						style={[styles.button, styles.buttonClose]}
						onPress={async() => {
								this.setModalVisible(!modalVisible);
								await this.createDirect();
								this.goRoom();
		  }}
					><CustomIcon name='send-filled' color='white' size={20} />
						<Text style={styles.textStyle}>Message</Text>
					</Pressable>
					</View>
			</View>
			</Modal>
		);
	}

	renderStatus = (room, roomUser) => {
		const { theme } = this.props;
		let isPeerSupporter = false;

		if (roomUser !== null
			&& roomUser !== undefined
			&& roomUser.parsedRoles !== null
			&& roomUser.parsedRoles !== undefined) {
			isPeerSupporter = roomUser.parsedRoles.indexOf('Peer Supporter') > -1;
		}
		if (isPeerSupporter && roomUser._id) {
			return <Status style={[styles.status]} theme={theme} size={18} id={roomUser._id} />;
		} else {
			return null;
		}
	};

	renderButton = (onPress, iconName, text, connect) => {
		const { theme } = this.props;

		const onActionPress = async() => {
			try {
						  await this.createDirect();
						 onPress();
			} catch {
				EventEmitter.emit(LISTENER, { message: I18n.t('error-action-not-allowed', { action: I18n.t('Create_Direct_Messages') }) });
			}
		};

		return (
			connect ? (
				<Button
					style={{ marginTop: 10, borderRadius: 20, width: '50%' }}
					title={I18n.t('Connect')}
					type='primary'
					onPress={onActionPress}
					disabled={false}
					testID='profile-library-view-connect'
					theme={theme}
					backgroundColor={themes[theme].connectButtonColor}
				/>
			) : (
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
			)
		);
	}

	renderButtons = (isPeerSupporter, canConnect, isConnected) => {
		const { jitsiEnabled, theme } = this.props;
		const { saving } = this.state;

		return (isPeerSupporter && !isConnected && canConnect)
			? (
				<Button
					style={{ marginTop: 10, borderRadius: 20, width: '50%' }}
					title={I18n.t('Connect')}
					type='primary'
					onPress={this.connect}
					disabled={false}
					testID='profile-library-view-connect'
					loading={saving}
					theme={theme}
					backgroundColor={themes[theme].connectButtonColor}
				/>

			) : (
				<View style={styles.roomButtonsContainer}>
					{this.renderButton(this.goRoom, 'message', I18n.t('Message'), true)}
					{jitsiEnabled ? this.renderButton(this.videoCall, 'camera', I18n.t('Video_call'), false) : null}
				</View>
			);
	}

	renderContent = () => {
		const { room, roomUser } = this.state;
		const { theme, user } = this.props;
		if (this.isDirect) {
			return <Direct roomUser={roomUser} theme={theme} user={user} />;
		} else if (this.t === 'l') {
			return <Livechat room={room} roomUser={roomUser} theme={theme} />;
		}
		return <Channel room={room} theme={theme} />;
	}

	renderPreContent = () => {
		const { roomUser } = this.state;
		const { theme } = this.props;
		if (roomUser?.customFields != null) {
			return (
				<View>
					<View style={{ alignContent: 'center', alignItems: 'center' }}>

						<View style={styles.locationView}>
							<CustomIcon name='pin-map' size={20} color={themes[theme].pinIconColor} />
							<Text style={{ color: themes[theme].titleText, fontSize: 20 }}>{`${ roomUser.customFields.Location }`}</Text>
						</View>

					</View>
					{roomUser.customFields['Glucose Monitoring Method'] && roomUser.customFields['Insulin Delivery Method'] ? (
						<View style={styles.deviceContainer}>
							<View style={styles.t1dView}>
								<Text style={{
									color: themes[theme].titleText, textAlign: 'center', bottom: 10, fontSize: 20
								}}
								>T1D Since
								</Text>
								<Text style={{ color: themes[theme].auxiliaryText, textAlign: 'center', fontSize: 18 }}>{roomUser?.customFields['T1D Since']}</Text>
							</View>
							<View style={{ marginRight: '50%' }}>
								<Text style={{
									color: themes[theme].titleText, textAlign: 'center', bottom: 10, fontSize: 20
								}}
								>Devices
								</Text>
								<Text style={{ color: themes[theme].auxiliaryText, textAlign: 'center', fontSize: 18 }}>{roomUser?.customFields['Glucose Monitoring Method']}</Text>
								<Text style={{ color: themes[theme].auxiliaryText, textAlign: 'center', fontSize: 18 }}>{roomUser?.customFields['Insulin Delivery Method']}</Text>
							</View>
						</View>
					) : (
						<Text style={{
							color: themes[theme].auxiliaryText, textAlign: 'center', fontSize: 18, marginTop: 20
						}}
						>{roomUser?.customFields['T1D Since']}
						</Text>
					)}

				</View>
			);
		}
	}

	render() {
		const { room, roomUser, modalVisible } = this.state;
		const { theme, user, route } = this.props;

		const isPeerSupporter = route.params?.isPeerSupporter;
		const isAdmin = ['admin', 'livechat-manager'].find(role => user.roles.includes(role)) !== undefined;

		const peerIds = (user === null
			|| user.customFields === null
			|| user.customFields === undefined
			|| user.customFields.ConnectIds === undefined
			|| user.customFields.ConnectIds === '')

			? [] : user.customFields.ConnectIds.split(',');


		const canConnect = !peerIds.includes(roomUser.username) && peerIds.length < 5 && !isAdmin;
		const isConnected = peerIds.includes(roomUser.username) && !isAdmin;

		const name = (isConnected) ? `${ roomUser?.name } ✅ ` : roomUser?.name;
		return (
			<ScrollView style={[styles.scroll, { backgroundColor: themes[theme].backgroundColor }]}>

				<StatusBar theme={theme} />
				<SafeAreaView
					theme={theme}
					testID='room-info-view'
				>
					<View style={[styles.avatarContainer, this.isDirect && styles.avatarContainerDirectRoom, { backgroundColor: themes[theme].auxiliaryBackground }]}>
						{this.renderAvatar(room, roomUser, isAdmin, isPeerSupporter, canConnect, isConnected)}
						<View style={{ flexDirection: 'row' }}><View style={{ marginTop: '5%' }}>{this.renderStatus(room, roomUser)}</View>
							<View style={styles.roomTitleContainer}>{ getRoomTitle(room, this.t, name, roomUser?.username, roomUser?.customFields?.Age, roomUser?.statusText, theme) }</View>
						</View>
						{this.isDirect ? this.renderPreContent(isAdmin, isPeerSupporter, canConnect, isConnected) : null}
						{this.isDirect ? this.renderButtons(isPeerSupporter, canConnect, isConnected) : null}

					</View>

					{isConnected ? this.renderModal() : null}
					{this.renderContent(isAdmin, isPeerSupporter, canConnect, isConnected)}

				</SafeAreaView>
			</ScrollView>
		);
	}
}

const mapStateToProps = state => ({
	baseUrl: state.server.server,
	user: getUserSelector(state),
	rooms: state.room.rooms,
	isMasterDetail: state.app.isMasterDetail,
	jitsiEnabled: state.settings.Jitsi_Enabled || false
});

export default connect(mapStateToProps)(withTheme(RoomInfoView));
