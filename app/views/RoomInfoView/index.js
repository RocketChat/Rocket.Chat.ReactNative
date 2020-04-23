import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, ScrollView } from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';
import { connect } from 'react-redux';
import moment from 'moment';
import _ from 'lodash';
import { SafeAreaView } from 'react-navigation';
import { CustomIcon } from '../../lib/Icons';
import Status from '../../containers/Status';
import Avatar from '../../containers/Avatar';
import styles from './styles';
import sharedStyles from '../Styles';
import database from '../../lib/database';
import RocketChat from '../../lib/rocketchat';
import RoomTypeIcon from '../../containers/RoomTypeIcon';
import I18n from '../../i18n';
import { CustomHeaderButtons, Item } from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import log from '../../utils/log';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import { themedHeader } from '../../utils/navigation';
import { getUserSelector } from '../../selectors/login';
import Markdown from '../../containers/markdown';

const PERMISSION_EDIT_ROOM = 'edit-room';
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
			<RoomTypeIcon type={room.prid ? 'discussion' : room.t} key='room-info-type' theme={theme} />
			<Text testID='room-info-view-name' style={[styles.roomTitle, { color: themes[theme].titleText }]} key='room-info-name'>{room.prid ? room.fname : room.name}</Text>
		</View>
	)
);

class RoomInfoView extends React.Component {
	static navigationOptions = ({ navigation, screenProps }) => {
		const showEdit = navigation.getParam('showEdit');
		const rid = navigation.getParam('rid');
		const t = navigation.getParam('t');
		return {
			title: t === 'd' ? I18n.t('User_Info') : I18n.t('Room_Info'),
			...themedHeader(screenProps.theme),
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
		Message_TimeFormat: PropTypes.string,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		const room = props.navigation.getParam('room');
		const roomUser = props.navigation.getParam('member');
		this.rid = props.navigation.getParam('rid');
		this.t = props.navigation.getParam('t');
		this.state = {
			room: room || { rid: this.rid, t: this.t },
			roomUser: roomUser || {},
			parsedRoles: []
		};
	}

	async componentDidMount() {
		const { roomUser, room: roomState } = this.state;
		if (this.t === 'd' && !_.isEmpty(roomUser)) {
			return;
		}

		if (this.t === 'd') {
			try {
				const roomUserId = RocketChat.getUidDirectMessage(roomState);
				const result = await RocketChat.getUserInfo(roomUserId);
				if (result.success) {
					const { roles } = result.user;
					let parsedRoles = [];
					if (roles && roles.length) {
						parsedRoles = await Promise.all(roles.map(async(role) => {
							const description = await this.getRoleDescription(role);
							return description;
						}));
					}
					this.setState({ roomUser: result.user, parsedRoles });
				}
			} catch (e) {
				log(e);
			}
			return;
		}

		const { navigation } = this.props;
		let room = navigation.getParam('room');
		if (room && room.observe) {
			this.roomObservable = room.observe();
			this.subscription = this.roomObservable
				.subscribe((changes) => {
					this.setState({ room: changes });
				});
		} else {
			try {
				const result = await RocketChat.getRoomInfo(this.rid);
				if (result.success) {
					// eslint-disable-next-line prefer-destructuring
					room = result.room;
					this.setState({ room });
				}
			} catch (e) {
				log(e);
			}
		}
		const permissions = await RocketChat.hasPermission([PERMISSION_EDIT_ROOM], room.rid);
		if (permissions[PERMISSION_EDIT_ROOM] && !room.prid && this.t !== 'l') {
			navigation.setParams({ showEdit: true });
		}
	}

	componentWillUnmount() {
		if (this.subscription && this.subscription.unsubscribe) {
			this.subscription.unsubscribe();
		}
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
	}

	goRoom = async() => {
		const { roomUser } = this.state;
		const { username } = roomUser;
		const { navigation } = this.props;
		try {
			const result = await RocketChat.createDirectMessage(username);
			if (result.success) {
				await navigation.navigate('RoomsListView');
				const rid = result.room._id;
				navigation.navigate('RoomView', { rid, name: RocketChat.getRoomTitle(roomUser), t: 'd' });
			}
		} catch (e) {
			// do nothing
		}
	}

	videoCall = () => RocketChat.callJitsi(this.rid)

	isDirect = () => this.t === 'd'

	renderItem = ({ label, content }) => {
		const { theme } = this.props;
		return (
			<View style={styles.item}>
				<Text accessibilityLabel={label} style={[styles.itemLabel, { color: themes[theme].titleText }]}>{label}</Text>
				<Markdown
					style={[styles.itemContent, { color: themes[theme].auxiliaryText }]}
					msg={content || `__${ I18n.t('No_label_provided', { label: label.toLowerCase() }) }__`}
					theme={theme}
				/>
			</View>
		);
	}

	renderRole = (description) => {
		const { theme } = this.props;
		if (description) {
			return (
				<View style={[styles.roleBadge, { backgroundColor: themes[theme].auxiliaryBackground }]} key={description}>
					<Text style={styles.role}>{ description }</Text>
				</View>
			);
		}
		return null;
	}

	renderRoles = () => {
		const { parsedRoles } = this.state;
		const { theme } = this.props;
		if (parsedRoles && parsedRoles.length) {
			return (
				<View style={styles.item}>
					<Text style={[styles.itemLabel, { color: themes[theme].titleText }]}>{I18n.t('Roles')}</Text>
					<View style={styles.rolesContainer}>
						{parsedRoles.map(role => this.renderRole(role))}
					</View>
				</View>
			);
		}
		return null;
	}

	renderTimezone = () => {
		const { roomUser } = this.state;
		const { Message_TimeFormat } = this.props;

		if (roomUser) {
			const { utcOffset } = roomUser;

			if (!utcOffset) {
				return null;
			}
			return this.renderItem({
				label: I18n.t('Timezone'),
				content: `${ moment().utcOffset(utcOffset).format(Message_TimeFormat) } (UTC ${ utcOffset })`
			});
		}
		return null;
	}

	renderAvatar = (room, roomUser) => {
		const { baseUrl, user, theme } = this.props;

		return (
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

	renderBroadcast = () => this.renderItem({
		label: I18n.t('Broadcast_Channel'),
		content: I18n.t('Broadcast_channel_Description')
	});

	renderCustomFields = () => {
		const { roomUser } = this.state;
		if (roomUser) {
			const { customFields } = roomUser;

			if (!roomUser.customFields) {
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

	renderButton = (onPress, iconName, text) => {
		const { theme } = this.props;
		return (
			<BorderlessButton
				onPress={onPress}
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

	renderButtons = () => (
		<View style={styles.roomButtonsContainer}>
			{this.renderButton(this.goRoom, 'message', I18n.t('Message'))}
			{this.renderButton(this.videoCall, 'video', I18n.t('Video_call'))}
		</View>
	)

	renderChannel = () => {
		const { room } = this.state;
		const { description, topic, announcement } = room;
		return (
			<>
				{this.renderItem({ label: I18n.t('Description'), content: description })}
				{this.renderItem({ label: I18n.t('Topic'), content: topic })}
				{this.renderItem({ label: I18n.t('Announcement'), content: announcement })}
				{room.broadcast ? this.renderBroadcast() : null}
			</>
		);
	}

	renderDirect = () => {
		const { roomUser } = this.state;
		return (
			<>
				{this.renderRoles()}
				{this.renderTimezone()}
				{this.renderCustomFields(roomUser._id)}
			</>
		);
	}

	render() {
		const { room, roomUser } = this.state;
		const { theme } = this.props;
		const isDirect = this.isDirect();
		if (!room) {
			return <View />;
		}
		return (
			<ScrollView style={[styles.scroll, { backgroundColor: themes[theme].backgroundColor }]}>
				<StatusBar theme={theme} />
				<SafeAreaView
					style={[styles.container, { backgroundColor: themes[theme].backgroundColor }]}
					forceInset={{ vertical: 'never' }}
					testID='room-info-view'
				>
					<View style={[styles.avatarContainer, isDirect && styles.avatarContainerDirectRoom, { backgroundColor: themes[theme].auxiliaryBackground }]}>
						{this.renderAvatar(room, roomUser)}
						<View style={styles.roomTitleContainer}>{ getRoomTitle(room, this.t, roomUser && roomUser.name, roomUser && roomUser.username, roomUser && roomUser.statusText, theme) }</View>
						{isDirect ? this.renderButtons() : null}
					</View>
					{isDirect ? this.renderDirect() : this.renderChannel()}
				</SafeAreaView>
			</ScrollView>
		);
	}
}

const mapStateToProps = state => ({
	baseUrl: state.server.server,
	user: getUserSelector(state),
	Message_TimeFormat: state.settings.Message_TimeFormat
});

export default connect(mapStateToProps)(withTheme(RoomInfoView));
