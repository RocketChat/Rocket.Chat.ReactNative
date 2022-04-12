import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';
import { connect } from 'react-redux';
import UAParser from 'ua-parser-js';
import isEmpty from 'lodash/isEmpty';
import { StackNavigationProp } from '@react-navigation/stack';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import { Observable, Subscription } from 'rxjs';

import { CustomIcon } from '../../lib/Icons';
import Status from '../../containers/Status';
import Avatar from '../../containers/Avatar';
import sharedStyles from '../Styles';
import RocketChat from '../../lib/rocketchat';
import RoomTypeIcon from '../../containers/RoomTypeIcon';
import I18n from '../../i18n';
import * as HeaderButton from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import log, { events, logEvent } from '../../utils/log';
import { themes } from '../../lib/constants';
import { TSupportedThemes, withTheme } from '../../theme';
import { MarkdownPreview } from '../../containers/markdown';
import { LISTENER } from '../../containers/Toast';
import EventEmitter from '../../utils/events';
import SafeAreaView from '../../containers/SafeAreaView';
import { goRoom } from '../../utils/goRoom';
import Navigation from '../../lib/navigation/appNavigation';
import Livechat from './Livechat';
import Channel from './Channel';
import Direct from './Direct';
import styles from './styles';
import { ChatsStackParamList } from '../../stacks/types';
import { MasterDetailInsideStackParamList } from '../../stacks/MasterDetailStack/types';
import { SubscriptionType, TSubscriptionModel, ISubscription, IUser, IApplicationState } from '../../definitions';
import { ILivechatVisitor } from '../../definitions/ILivechatVisitor';

interface IGetRoomTitle {
	room: ISubscription;
	type: SubscriptionType;
	name?: string;
	username: string;
	statusText?: string;
	theme: TSupportedThemes;
}

const getRoomTitle = ({ room, type, name, username, statusText, theme }: IGetRoomTitle) =>
	type === SubscriptionType.DIRECT ? (
		<>
			<Text testID='room-info-view-name' style={[styles.roomTitle, { color: themes[theme].titleText }]}>
				{name}
			</Text>
			{username && (
				<Text
					testID='room-info-view-username'
					style={[styles.roomUsername, { color: themes[theme].auxiliaryText }]}>{`@${username}`}</Text>
			)}
			{!!statusText && (
				<View testID='room-info-view-custom-status'>
					<MarkdownPreview msg={statusText} style={[styles.roomUsername, { color: themes[theme].auxiliaryText }]} />
				</View>
			)}
		</>
	) : (
		<View style={styles.roomTitleRow}>
			<RoomTypeIcon
				type={room.prid ? 'discussion' : room.t}
				teamMain={room.teamMain}
				key='room-info-type'
				status={room.visitor?.status}
			/>
			<Text testID='room-info-view-name' style={[styles.roomTitle, { color: themes[theme].titleText }]} key='room-info-name'>
				{RocketChat.getRoomTitle(room)}
			</Text>
		</View>
	);

interface IRoomInfoViewProps {
	navigation: CompositeNavigationProp<
		StackNavigationProp<ChatsStackParamList, 'RoomInfoView'>,
		StackNavigationProp<MasterDetailInsideStackParamList>
	>;
	route: RouteProp<ChatsStackParamList, 'RoomInfoView'>;
	rooms: string[];
	theme: TSupportedThemes;
	isMasterDetail: boolean;
	jitsiEnabled: boolean;
	editRoomPermission?: string[];
	editOmnichannelContact?: string[];
	editLivechatRoomCustomfields?: string[];
	roles: { [key: string]: string };
}

interface IUserParsed extends IUser {
	parsedRoles?: string[];
}

export interface ILivechatVisitorModified extends ILivechatVisitor {
	os?: string;
	browser?: string;
}

interface IRoomInfoViewState {
	room: ISubscription;
	// TODO: Could be IUserParsed or ILivechatVisitorModified
	roomUser: any;
	showEdit: boolean;
}

class RoomInfoView extends React.Component<IRoomInfoViewProps, IRoomInfoViewState> {
	private rid: string;

	private t: SubscriptionType;

	private unsubscribeFocus?: () => void;

	private subscription?: Subscription;

	private roomObservable?: Observable<TSubscriptionModel>;

	constructor(props: IRoomInfoViewProps) {
		super(props);
		const room = props.route.params?.room;
		const roomUser = props.route.params?.member;
		this.rid = props.route.params?.rid;
		this.t = props.route.params?.t;
		this.state = {
			room: (room || { rid: this.rid, t: this.t }) as any,
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
			title: t === SubscriptionType.DIRECT ? I18n.t('User_Info') : I18n.t('Room_Info'),
			headerRight: showEdit
				? () => (
						<HeaderButton.Container>
							<HeaderButton.Item
								iconName='edit'
								onPress={() => {
									const isLivechat = t === SubscriptionType.OMNICHANNEL;
									logEvent(events[`RI_GO_${isLivechat ? 'LIVECHAT' : 'RI'}_EDIT`]);
									navigation.navigate(isLivechat ? 'LivechatEditView' : 'RoomInfoEditView', { rid, room, roomUser });
								}}
								testID='room-info-view-edit-button'
							/>
						</HeaderButton.Container>
				  )
				: undefined
		});
	};

	get isDirect() {
		const { room } = this.state;
		return room.t === SubscriptionType.DIRECT;
	}

	get isLivechat() {
		const { room } = this.state;
		return room.t === SubscriptionType.OMNICHANNEL;
	}

	getRoleDescription = (id: string) => {
		const { roles } = this.props;
		return roles[id];
	};

	loadVisitor = async () => {
		const { room } = this.state;
		try {
			if (room.visitor?._id) {
				const result = await RocketChat.getVisitorInfo(room.visitor._id);
				if (result.success) {
					const { visitor } = result;
					const params: { os?: string; browser?: string } = {};
					if (visitor.userAgent) {
						const ua = new UAParser();
						ua.setUA(visitor.userAgent);
						params.os = `${ua.getOS().name} ${ua.getOS().version}`;
						params.browser = `${ua.getBrowser().name} ${ua.getBrowser().version}`;
					}
					this.setState({ roomUser: { ...visitor, ...params } }, () => this.setHeader());
				}
			}
		} catch (error) {
			// Do nothing
		}
	};

	parseRoles = (roleArray: string[]) =>
		Promise.all(
			roleArray.map(async role => {
				const description = await this.getRoleDescription(role);
				return description;
			})
		);

	loadUser = async () => {
		const { room, roomUser } = this.state;

		if (isEmpty(roomUser)) {
			try {
				const roomUserId = RocketChat.getUidDirectMessage(room);
				const result = await RocketChat.getUserInfo(roomUserId);
				if (result.success) {
					const { user } = result;
					const { roles } = user;
					const parsedRoles: { parsedRoles?: string[] } = {};
					if (roles && roles.length) {
						parsedRoles.parsedRoles = await this.parseRoles(roles);
					}

					this.setState({ roomUser: { ...user, ...parsedRoles } });
				}
			} catch {
				// do nothing
			}
		} else {
			try {
				const { roles } = roomUser;
				if (roles && roles.length) {
					const parsedRoles = await this.parseRoles(roles);
					this.setState({ roomUser: { ...roomUser, parsedRoles } });
				} else {
					this.setState({ roomUser });
				}
			} catch (e) {
				// do nothing
			}
		}
	};

	loadRoom = async () => {
		const { room: roomState } = this.state;
		const { route, editRoomPermission, editOmnichannelContact, editLivechatRoomCustomfields } = this.props;
		let room = route.params?.room as any;
		const roomModel = room as TSubscriptionModel;
		if (roomModel && roomModel.observe) {
			this.roomObservable = roomModel.observe();
			this.subscription = this.roomObservable.subscribe(changes => {
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

		const permissionToEdit = this.isLivechat ? [editOmnichannelContact, editLivechatRoomCustomfields] : [editRoomPermission];

		const permissions = await RocketChat.hasPermission(permissionToEdit, room.rid);
		if (permissions.some(Boolean)) {
			this.setState({ showEdit: true }, () => this.setHeader());
		}
	};

	createDirect = () =>
		new Promise<void>(async (resolve, reject) => {
			const { route } = this.props;

			// We don't need to create a direct
			const member = route.params?.member;
			if (!isEmpty(member)) {
				return resolve();
			}

			// TODO: Check if some direct with the user already exists on database
			try {
				const {
					roomUser: { username }
				} = this.state;
				const result = await RocketChat.createDirectMessage(username);
				if (result.success) {
					const {
						room: { rid }
					} = result;
					return this.setState(({ room }) => ({ room: { ...room, rid } }), resolve);
				}
			} catch {
				// do nothing
			}
			reject();
		});

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
	};

	videoCall = () => {
		const { room } = this.state;
		RocketChat.callJitsi(room);
	};

	renderAvatar = (room: ISubscription, roomUser: IUserParsed) => {
		const { theme } = this.props;

		return (
			<Avatar text={room.name || roomUser.username} style={styles.avatar} type={this.t} size={100} rid={room?.rid}>
				{this.t === SubscriptionType.DIRECT && roomUser._id ? (
					<View style={[sharedStyles.status, { backgroundColor: themes[theme].auxiliaryBackground }]}>
						<Status size={20} id={roomUser._id} />
					</View>
				) : null}
			</Avatar>
		);
	};

	renderButton = (onPress: () => void, iconName: string, text: string) => {
		const { theme } = this.props;

		const onActionPress = async () => {
			try {
				if (this.isDirect) {
					await this.createDirect();
				}
				onPress();
			} catch {
				EventEmitter.emit(LISTENER, {
					message: I18n.t('error-action-not-allowed', { action: I18n.t('Create_Direct_Messages') })
				});
			}
		};

		return (
			<BorderlessButton onPress={onActionPress} style={styles.roomButton}>
				<CustomIcon name={iconName} size={30} color={themes[theme].actionTintColor} />
				<Text style={[styles.roomButtonText, { color: themes[theme].actionTintColor }]}>{text}</Text>
			</BorderlessButton>
		);
	};

	renderButtons = () => {
		const { jitsiEnabled } = this.props;
		return (
			<View style={styles.roomButtonsContainer}>
				{this.renderButton(this.goRoom, 'message', I18n.t('Message'))}
				{jitsiEnabled && this.isDirect ? this.renderButton(this.videoCall, 'camera', I18n.t('Video_call')) : null}
			</View>
		);
	};

	renderContent = () => {
		const { room, roomUser } = this.state;

		if (this.isDirect) {
			return <Direct roomUser={roomUser} />;
		}

		if (this.t === SubscriptionType.OMNICHANNEL) {
			return <Livechat room={room} roomUser={roomUser} />;
		}
		return <Channel room={room} />;
	};

	render() {
		const { room, roomUser } = this.state;
		const { theme } = this.props;
		return (
			<ScrollView style={[styles.scroll, { backgroundColor: themes[theme].backgroundColor }]}>
				<StatusBar />
				<SafeAreaView style={{ backgroundColor: themes[theme].backgroundColor }} testID='room-info-view'>
					<View style={[styles.avatarContainer, { backgroundColor: themes[theme].auxiliaryBackground }]}>
						{this.renderAvatar(room, roomUser)}
						<View style={styles.roomTitleContainer}>
							{getRoomTitle({
								room,
								type: this.t,
								name: roomUser?.name,
								username: roomUser?.username,
								statusText: roomUser?.statusText,
								theme
							})}
						</View>
						{this.renderButtons()}
					</View>
					{this.renderContent()}
				</SafeAreaView>
			</ScrollView>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	rooms: state.room.rooms,
	isMasterDetail: state.app.isMasterDetail,
	jitsiEnabled: (state.settings.Jitsi_Enabled as boolean) || false,
	editRoomPermission: state.permissions['edit-room'],
	editOmnichannelContact: state.permissions['edit-omnichannel-contact'],
	editLivechatRoomCustomfields: state.permissions['edit-livechat-room-customfields'],
	roles: state.roles
});

export default connect(mapStateToProps)(withTheme(RoomInfoView));
