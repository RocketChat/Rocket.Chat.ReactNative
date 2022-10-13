import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';
import { connect } from 'react-redux';
import UAParser from 'ua-parser-js';
import isEmpty from 'lodash/isEmpty';
import { StackNavigationProp } from '@react-navigation/stack';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import { Observable, Subscription } from 'rxjs';

import { CustomIcon, TIconsName } from '../../containers/CustomIcon';
import Status from '../../containers/Status';
import Avatar from '../../containers/Avatar';
import sharedStyles from '../Styles';
import RoomTypeIcon from '../../containers/RoomTypeIcon';
import I18n from '../../i18n';
import * as HeaderButton from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import log, { events, logEvent } from '../../lib/methods/helpers/log';
import { themes } from '../../lib/constants';
import { TSupportedThemes, withTheme } from '../../theme';
import { MarkdownPreview } from '../../containers/markdown';
import { LISTENER } from '../../containers/Toast';
import EventEmitter from '../../lib/methods/helpers/events';
import SafeAreaView from '../../containers/SafeAreaView';
import { goRoom } from '../../lib/methods/helpers/goRoom';
import Navigation from '../../lib/navigation/appNavigation';
import Livechat from './Livechat';
import Channel from './Channel';
import Direct from './Direct';
import styles from './styles';
import { ChatsStackParamList } from '../../stacks/types';
import { MasterDetailInsideStackParamList } from '../../stacks/MasterDetailStack/types';
import { SubscriptionType, TSubscriptionModel, ISubscription, IUser, IApplicationState } from '../../definitions';
import { ILivechatVisitor } from '../../definitions/ILivechatVisitor';
import { callJitsi } from '../../lib/methods';
import { getRoomTitle, getUidDirectMessage, hasPermission } from '../../lib/methods/helpers';
import { Services } from '../../lib/services';
import { getSubscriptionByRoomId } from '../../lib/database/services/Subscription';
import { handleIgnore } from '../../lib/methods/helpers/handleIgnore';

interface IGetRoomTitle {
	room: ISubscription;
	type: SubscriptionType;
	name?: string;
	username: string;
	statusText?: string;
	theme: TSupportedThemes;
}

const renderRoomTitle = ({ room, type, name, username, statusText, theme }: IGetRoomTitle) =>
	type === SubscriptionType.DIRECT ? (
		<>
			<Text testID='room-info-view-name' style={[styles.roomTitle, { color: themes[theme].titleText }]}>
				{name}
			</Text>
			{username && (
				<Text
					testID='room-info-view-username'
					style={[styles.roomUsername, { color: themes[theme].auxiliaryText }]}
				>{`@${username}`}</Text>
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
				sourceType={room.source}
			/>
			<Text testID='room-info-view-name' style={[styles.roomTitle, { color: themes[theme].titleText }]} key='room-info-name'>
				{getRoomTitle(room)}
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

export interface IUserParsed extends IUser {
	parsedRoles?: string[];
}

export interface ILivechatVisitorModified extends ILivechatVisitor {
	os?: string;
	browser?: string;
}

interface IRoomInfoViewState {
	room: ISubscription;
	roomUser: IUserParsed | ILivechatVisitorModified;
	showEdit: boolean;
	roomFromRid?: TSubscriptionModel;
}

class RoomInfoView extends React.Component<IRoomInfoViewProps, IRoomInfoViewState> {
	private rid: string;

	private t: SubscriptionType;

	private unsubscribeFocus?: () => void;

	private subscription?: Subscription;

	private roomObservable?: Observable<TSubscriptionModel>;

	private fromRid?: string;

	private subscriptionRoomFromRid?: Subscription;

	constructor(props: IRoomInfoViewProps) {
		super(props);
		const room = props.route.params?.room;
		const roomUser = props.route.params?.member;
		this.rid = props.route.params?.rid;
		this.t = props.route.params?.t;
		this.fromRid = props.route.params?.fromRid;
		this.state = {
			room: (room || { rid: this.rid, t: this.t }) as any,
			roomUser: roomUser || {},
			showEdit: false,
			roomFromRid: undefined
		};
	}

	componentDidMount() {
		if (this.isDirect) {
			this.loadUser();
			this.loadRoomFromRid();
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
		if (this.subscriptionRoomFromRid && this.subscriptionRoomFromRid.unsubscribe) {
			this.subscriptionRoomFromRid.unsubscribe();
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
				const result = await Services.getVisitorInfo(room.visitor._id);
				if (result.success) {
					const { visitor } = result;
					const params: { os?: string; browser?: string } = {};
					if (visitor.userAgent) {
						const ua = new UAParser();
						ua.setUA(visitor.userAgent);
						params.os = `${ua.getOS().name} ${ua.getOS().version}`;
						params.browser = `${ua.getBrowser().name} ${ua.getBrowser().version}`;
					}
					this.setState({ roomUser: { ...visitor, ...params } as ILivechatVisitorModified }, () => this.setHeader());
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
				const roomUserId = getUidDirectMessage(room);
				const result = await Services.getUserInfo(roomUserId);
				if (result.success) {
					const { user } = result;
					const { roles } = user;
					const parsedRoles: { parsedRoles?: string[] } = {};
					if (roles && roles.length) {
						parsedRoles.parsedRoles = await this.parseRoles(roles);
					}

					this.setState({ roomUser: { ...user, ...parsedRoles } as IUserParsed });
				}
			} catch {
				// do nothing
			}
		} else {
			try {
				const { roles } = roomUser as IUserParsed;
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

	loadRoomFromRid = async () => {
		if (this.fromRid) {
			try {
				const sub = await getSubscriptionByRoomId(this.fromRid);
				this.subscriptionRoomFromRid = sub?.observe().subscribe(roomFromRid => {
					this.setState({ roomFromRid });
				});
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
				const result = await Services.getRoomInfo(this.rid);
				if (result.success) {
					({ room } = result);
					this.setState({ room: { ...roomState, ...room } });
				}
			} catch (e) {
				log(e);
			}
		}

		const permissionToEdit = this.isLivechat ? [editOmnichannelContact, editLivechatRoomCustomfields] : [editRoomPermission];

		const permissions = await hasPermission(permissionToEdit, room.rid);
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
				const result = await Services.createDirectMessage(username);
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
		const { room } = this.state;
		const { rooms, navigation, isMasterDetail } = this.props;
		const params = {
			rid: room.rid,
			name: getRoomTitle(room),
			t: room.t,
			roomUserId: getUidDirectMessage(room)
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

	handleCreateDirectMessage = async (onPress: () => void) => {
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

	videoCall = () => {
		const { room } = this.state;
		callJitsi(room);
	};

	handleBlockUser = async (rid: string, blocked: string, block: boolean) => {
		logEvent(events.RI_TOGGLE_BLOCK_USER);
		try {
			await Services.toggleBlockUser(rid, blocked, block);
		} catch (e) {
			log(e);
		}
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

	renderButton = (onPress: () => void, iconName: TIconsName, text: string, danger?: boolean) => {
		const { theme } = this.props;
		const color = danger ? themes[theme].dangerColor : themes[theme].actionTintColor;
		return (
			<BorderlessButton testID={`room-info-view-${iconName}`} onPress={onPress} style={styles.roomButton}>
				<CustomIcon name={iconName} size={30} color={color} />
				<Text style={[styles.roomButtonText, { color }]}>{text}</Text>
			</BorderlessButton>
		);
	};

	renderButtons = () => {
		const { roomFromRid, roomUser } = this.state;
		const { jitsiEnabled } = this.props;

		const isFromDm = roomFromRid?.rid ? new RegExp(roomUser._id).test(roomFromRid.rid) : false;
		const isDirectFromSaved = this.isDirect && this.fromRid && roomFromRid;

		// Following the web behavior, when is a DM with myself, shouldn't appear block or ignore option
		const isDmWithMyself = roomFromRid?.uids && roomFromRid.uids?.filter(uid => uid !== roomUser._id).length === 0;

		const ignored = roomFromRid?.ignored;
		const isIgnored = ignored?.includes?.(roomUser._id);

		const blocker = roomFromRid?.blocker;

		return (
			<View style={styles.roomButtonsContainer}>
				{this.renderButton(() => this.handleCreateDirectMessage(this.goRoom), 'message', I18n.t('Message'))}
				{jitsiEnabled && this.isDirect
					? this.renderButton(() => this.handleCreateDirectMessage(this.videoCall), 'camera', I18n.t('Video_call'))
					: null}
				{isDirectFromSaved && !isFromDm && !isDmWithMyself
					? this.renderButton(
							() => handleIgnore(roomUser._id, !isIgnored, roomFromRid.rid),
							'ignore',
							I18n.t(isIgnored ? 'Unignore' : 'Ignore'),
							true
					  )
					: null}
				{isDirectFromSaved && isFromDm
					? this.renderButton(
							() => this.handleBlockUser(roomFromRid.rid, roomUser._id, !blocker),
							'ignore',
							I18n.t(`${blocker ? 'Unblock' : 'Block'}_user`),
							true
					  )
					: null}
			</View>
		);
	};

	renderContent = () => {
		const { room, roomUser } = this.state;

		if (this.isDirect) {
			return <Direct roomUser={roomUser as IUserParsed} />;
		}

		if (this.t === SubscriptionType.OMNICHANNEL) {
			return <Livechat room={room} roomUser={roomUser as ILivechatVisitorModified} />;
		}
		return <Channel room={room} />;
	};

	render() {
		const { room, roomUser } = this.state;
		const { theme } = this.props;
		const roomUserParsed = roomUser as IUserParsed;

		return (
			<ScrollView style={[styles.scroll, { backgroundColor: themes[theme].backgroundColor }]}>
				<StatusBar />
				<SafeAreaView style={{ backgroundColor: themes[theme].backgroundColor }} testID='room-info-view'>
					<View style={[styles.avatarContainer, { backgroundColor: themes[theme].auxiliaryBackground }]}>
						{this.renderAvatar(room, roomUserParsed)}
						<View style={styles.roomTitleContainer}>
							{renderRoomTitle({
								room,
								type: this.t,
								name: roomUserParsed?.name,
								username: roomUserParsed?.username,
								statusText: roomUserParsed?.statusText,
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
