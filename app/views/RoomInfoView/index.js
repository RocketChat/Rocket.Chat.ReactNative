import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, ScrollView } from 'react-native';
import { connect } from 'react-redux';
import moment from 'moment';
import { SafeAreaView } from 'react-navigation';

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

const PERMISSION_EDIT_ROOM = 'edit-room';

const camelize = str => str.replace(/^(.)/, (match, chr) => chr.toUpperCase());
const getRoomTitle = (room, type, name, theme) => (type === 'd'
	? <Text testID='room-info-view-name' style={[styles.roomTitle, { color: themes[theme].titleText }]}>{name}</Text>
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
		return {
			title: I18n.t('Room_Info'),
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
		this.rid = props.navigation.getParam('rid');
		this.t = props.navigation.getParam('t');
		this.state = {
			room: room || {},
			roomUser: {},
			parsedRoles: []
		};
	}

	async componentDidMount() {
		if (this.t === 'd') {
			const { user } = this.props;
			const roomUserId = RocketChat.getRoomMemberId(this.rid, user.id);
			try {
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
		if (permissions[PERMISSION_EDIT_ROOM] && !room.prid) {
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

	isDirect = () => this.t === 'd'

	renderItem = (key, room) => {
		const { theme } = this.props;
		return (
			<View style={styles.item}>
				<Text style={[styles.itemLabel, { color: themes[theme].titleText }]}>{I18n.t(camelize(key))}</Text>
				<Text
					style={[styles.itemContent, !room[key] && styles.itemContent__empty, { color: themes[theme].auxiliaryText }]}
					testID={`room-info-view-${ key }`}
				>{ room[key] ? room[key] : I18n.t(`No_${ key }_provided`) }
				</Text>
			</View>
		);
	}

	renderRole = (description) => {
		const { theme } = this.props;
		if (description) {
			return (
				<View style={[styles.roleBadge, { backgroundColor: themes[theme].focusedBackground }]} key={description}>
					<Text style={styles.role}>{ description }</Text>
				</View>
			);
		}
		return null;
	}

	renderRoles = () => {
		const { parsedRoles } = this.state;
		if (parsedRoles && parsedRoles.length) {
			return (
				<View style={styles.item}>
					<Text style={styles.itemLabel}>{I18n.t('Roles')}</Text>
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
		const { Message_TimeFormat, theme } = this.props;

		if (roomUser) {
			const { utcOffset } = roomUser;

			if (!utcOffset) {
				return null;
			}
			return (
				<View style={styles.item}>
					<Text style={[styles.itemLabel, { color: themes[theme].titleText }]}>{I18n.t('Timezone')}</Text>
					<Text style={[styles.itemContent, { color: themes[theme].auxiliaryText }]}>{moment().utcOffset(utcOffset).format(Message_TimeFormat)} (UTC { utcOffset })</Text>
				</View>
			);
		}
		return null;
	}

	renderAvatar = (room, roomUser) => {
		const { baseUrl, user } = this.props;

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
				{this.t === 'd' && roomUser._id ? <Status style={[sharedStyles.status, styles.status]} size={24} id={roomUser._id} /> : null}
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

	renderChannel = () => {
		const { room } = this.state;
		return (
			<>
				{this.renderItem('description', room)}
				{this.renderItem('topic', room)}
				{this.renderItem('announcement', room)}
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
					<View style={styles.avatarContainer}>
						{this.renderAvatar(room, roomUser)}
						<View style={styles.roomTitleContainer}>{ getRoomTitle(room, this.t, roomUser && roomUser.name, theme) }</View>
					</View>
					{this.isDirect() ? this.renderDirect() : this.renderChannel()}
				</SafeAreaView>
			</ScrollView>
		);
	}
}

const mapStateToProps = state => ({
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	user: {
		id: state.login.user && state.login.user.id,
		token: state.login.user && state.login.user.token
	},
	Message_TimeFormat: state.settings.Message_TimeFormat
});

export default connect(mapStateToProps)(withTheme(RoomInfoView));
