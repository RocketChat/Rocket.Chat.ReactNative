/* eslint-disable complexity */
import { Q } from '@nozbe/watermelondb';
import { NativeStackNavigationOptions, NativeStackNavigationProp } from '@react-navigation/native-stack';
import isEmpty from 'lodash/isEmpty';
import React from 'react';
import { Share, Text, View } from 'react-native';
import { connect } from 'react-redux';
import { Observable, Subscription } from 'rxjs';
import { CompositeNavigationProp } from '@react-navigation/native';

import { leaveRoom } from '../../actions/room';
import Avatar from '../../containers/Avatar';
import * as HeaderButton from '../../containers/HeaderButton';
import * as List from '../../containers/List';
import { MarkdownPreview } from '../../containers/markdown';
import RoomTypeIcon from '../../containers/RoomTypeIcon';
import SafeAreaView from '../../containers/SafeAreaView';
import Status from '../../containers/Status';
import StatusBar from '../../containers/StatusBar';
import { IApplicationState, IBaseScreen, ISubscription, IUser, SubscriptionType, TSubscriptionModel } from '../../definitions';
import { withDimensions } from '../../dimensions';
import I18n from '../../i18n';
import database from '../../lib/database';
import protectedFunction from '../../lib/methods/helpers/protectedFunction';
import { getUserSelector } from '../../selectors/login';
import { ChatsStackParamList } from '../../stacks/types';
import { withTheme } from '../../theme';
import { showConfirmationAlert, showErrorAlert } from '../../lib/methods/helpers/info';
import log, { events, logEvent } from '../../lib/methods/helpers/log';
import Touch from '../../containers/Touch';
import sharedStyles from '../Styles';
import styles from './styles';
import { ERoomType } from '../../definitions/ERoomType';
import { E2E_ROOM_TYPES, themes } from '../../lib/constants';
import { getPermalinkChannel } from '../../lib/methods';
import {
	canAutoTranslate as canAutoTranslateMethod,
	getRoomAvatar,
	getRoomTitle,
	getUidDirectMessage,
	hasPermission,
	isGroupChat,
	compareServerVersion,
	isTeamRoom
} from '../../lib/methods/helpers';
import { Services } from '../../lib/services';
import { getSubscriptionByRoomId } from '../../lib/database/services/Subscription';
import { IActionSheetProvider, withActionSheet } from '../../containers/ActionSheet';
import { MasterDetailInsideStackParamList } from '../../stacks/MasterDetailStack/types';
import { closeLivechat } from '../../lib/methods/helpers/closeLivechat';
import { ILivechatDepartment } from '../../definitions/ILivechatDepartment';
import { ILivechatTag } from '../../definitions/ILivechatTag';
import CallSection from './components/CallSection';
import { TNavigation } from '../../stacks/stackType';
import * as EncryptionUtils from '../../lib/encryption/utils';

type StackType = ChatsStackParamList & TNavigation;

interface IOnPressTouch {
	<T extends keyof StackType>(item: { route?: T; params?: StackType[T]; event?: Function }): void;
}

interface IRoomActionsViewProps extends IActionSheetProvider, IBaseScreen<StackType, 'RoomActionsView'> {
	userId: string;
	jitsiEnabled: boolean;
	jitsiEnableTeams: boolean;
	jitsiEnableChannels: boolean;
	encryptionEnabled: boolean;
	fontScale: number;
	serverVersion: string | null;
	editRoomPermission?: string[];
	toggleRoomE2EEncryptionPermission?: string[];
	viewBroadcastMemberListPermission?: string[];
	createTeamPermission?: string[];
	addTeamChannelPermission?: string[];
	moveRoomToTeamPermission?: string[];
	convertTeamPermission?: string[];
	viewCannedResponsesPermission?: string[];
	livechatAllowManualOnHold?: boolean;
	livechatRequestComment?: boolean;
	navigation: CompositeNavigationProp<
		NativeStackNavigationProp<ChatsStackParamList, 'RoomActionsView'>,
		NativeStackNavigationProp<MasterDetailInsideStackParamList & TNavigation>
	>;
	videoConf_Enable_DMs: boolean;
	videoConf_Enable_Channels: boolean;
	videoConf_Enable_Groups: boolean;
	videoConf_Enable_Teams: boolean;
}

interface IRoomActionsViewState {
	room: TSubscriptionModel;
	membersCount?: number;
	member: Partial<IUser>;
	joined: boolean;
	canViewMembers: boolean;
	canAutoTranslate: boolean;
	canEdit: boolean;
	canToggleEncryption: boolean;
	canCreateTeam: boolean;
	canAddChannelToTeam: boolean;
	canConvertTeam: boolean;
	hasE2EEWarning: boolean;
	loading: boolean;
}

class RoomActionsView extends React.Component<IRoomActionsViewProps, IRoomActionsViewState> {
	private mounted: boolean;
	private rid: string;
	private t: string;
	private joined: boolean;
	private omnichannelPermissions?: {
		canForwardGuest: boolean;
		canReturnQueue: boolean;
		canViewCannedResponse: boolean;
		canPlaceLivechatOnHold: boolean;
	};
	private roomObservable?: Observable<TSubscriptionModel>;
	private subscription?: Subscription;

	static navigationOptions = ({
		navigation,
		isMasterDetail
	}: Pick<IRoomActionsViewProps, 'navigation' | 'isMasterDetail'>): NativeStackNavigationOptions => {
		const options: NativeStackNavigationOptions = {
			title: I18n.t('Actions')
		};
		if (isMasterDetail) {
			options.headerLeft = () => <HeaderButton.CloseModal navigation={navigation} testID='room-actions-view-close' />;
		}
		return options;
	};

	constructor(props: IRoomActionsViewProps) {
		super(props);
		this.mounted = false;
		const room = props.route.params?.room;
		const member = props.route.params?.member;
		this.rid = props.route.params?.rid;
		this.t = props.route.params?.t;
		this.joined = props.route.params?.joined;
		this.omnichannelPermissions = props.route.params?.omnichannelPermissions;
		this.state = {
			room: room || { rid: this.rid, t: this.t },
			membersCount: 0,
			member: member || {},
			joined: !!room,
			canViewMembers: false,
			canAutoTranslate: false,
			canEdit: false,
			canToggleEncryption: false,
			canCreateTeam: false,
			canAddChannelToTeam: false,
			canConvertTeam: false,
			hasE2EEWarning: false,
			loading: false
		};
		if (room && room.observe && room.rid) {
			const { encryptionEnabled } = this.props;
			this.roomObservable = room.observe();
			this.subscription = this.roomObservable.subscribe(changes => {
				if (this.mounted) {
					const hasE2EEWarning = EncryptionUtils.hasE2EEWarning({
						encryptionEnabled,
						E2EKey: room.E2EKey,
						roomEncrypted: room.encrypted
					});
					this.setState({ room: changes, membersCount: changes.usersCount, hasE2EEWarning });
				} else {
					// @ts-ignore
					this.state.room = changes;
					// @ts-ignore
					this.state.membersCount = changes.usersCount;
				}
			});
		}
	}

	async componentDidMount() {
		this.mounted = true;
		const { room, member } = this.state;
		const { encryptionEnabled } = this.props;
		if (room.rid) {
			if (!room.id) {
				if (room.t === SubscriptionType.OMNICHANNEL) {
					if (!this.isOmnichannelPreview) {
						const result = await getSubscriptionByRoomId(room.rid);
						if (result) {
							this.setState({ room: result });
						}
					}
				} else {
					try {
						const result = await Services.getChannelInfo(room.rid);
						if (result.success) {
							// @ts-ignore
							this.setState({ room: { ...result.channel, rid: result.channel._id } });
						}
					} catch (e) {
						log(e);
					}
				}
			}

			if (room && room.t !== 'd' && (await this.canViewMembers())) {
				try {
					const counters = await Services.getRoomCounters(room.rid, room.t as any);
					if (counters.success) {
						await this.updateUsersCount(counters.members);
						this.setState({ joined: counters.joined });
					}
				} catch (e) {
					log(e);
				}
			} else if (room.t === 'd' && isEmpty(member)) {
				this.updateRoomMember();
			}

			const canAutoTranslate = canAutoTranslateMethod();
			const canEdit = await this.canEdit();
			const canToggleEncryption = await this.canToggleEncryption();
			const canViewMembers = await this.canViewMembers();
			const canCreateTeam = await this.canCreateTeam();
			const canAddChannelToTeam = await this.hasMoveToTeamPermission(room.rid);
			const canConvertTeam = await this.canConvertTeam();
			const hasE2EEWarning = EncryptionUtils.hasE2EEWarning({
				encryptionEnabled,
				E2EKey: room.E2EKey,
				roomEncrypted: room.encrypted
			});

			this.setState({
				canAutoTranslate,
				canEdit,
				canToggleEncryption,
				canViewMembers,
				canCreateTeam,
				canAddChannelToTeam,
				canConvertTeam,
				hasE2EEWarning
			});
		}
	}

	componentWillUnmount() {
		if (this.subscription && this.subscription.unsubscribe) {
			this.subscription.unsubscribe();
		}
	}

	get isOmnichannelPreview() {
		const { room } = this.state;
		return room.t === 'l' && room.status === 'queued' && !this.joined;
	}

	updateUsersCount = async (members: number) => {
		const { room } = this.state;
		if (members === room.usersCount) return;
		try {
			const db = database.active;
			await db.write(async () => {
				await room.update(
					protectedFunction((r: TSubscriptionModel) => {
						r.usersCount = members;
					})
				);
			});
		} catch {
			//
		}
	};

	onPressTouchable: IOnPressTouch = (item: {
		route?: keyof StackType;
		params?: StackType[keyof StackType];
		event?: Function;
	}) => {
		const { route, event, params } = item;
		if (route) {
			/**
			 * TODO: params can vary too much and ts is going to be happy
			 * Instead of playing with this, we should think on a better `logEvent` function
			 */
			// @ts-ignore
			logEvent(events[`RA_GO_${route.replace('View', '').toUpperCase()}${params.name ? params.name.toUpperCase() : ''}`]);
			const { navigation } = this.props;
			// @ts-ignore
			navigation.navigate(route, params);
		}
		if (event) {
			return event();
		}
	};

	canEdit = async () => {
		const { room } = this.state;
		const { editRoomPermission } = this.props;
		const { rid } = room;
		const permissions = await hasPermission([editRoomPermission], rid);

		const canEdit = permissions[0];
		return canEdit;
	};

	canCreateTeam = async () => {
		const { room } = this.state;
		const { createTeamPermission } = this.props;
		const { rid } = room;
		const permissions = await hasPermission([createTeamPermission], rid);

		const canCreateTeam = permissions[0];
		return canCreateTeam;
	};

	hasMoveToTeamPermission = async (rid: string) => {
		const { addTeamChannelPermission, moveRoomToTeamPermission, serverVersion } = this.props;
		if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '7.0.0')) {
			const result = await hasPermission([moveRoomToTeamPermission], rid);
			return result[0];
		}
		const result = await hasPermission([addTeamChannelPermission], rid);
		return result[0];
	};

	canConvertTeam = async () => {
		const { room } = this.state;
		const { convertTeamPermission } = this.props;
		const { rid } = room;
		const permissions = await hasPermission([convertTeamPermission], rid);

		const canConvertTeam = permissions[0];
		return canConvertTeam;
	};

	canToggleEncryption = async () => {
		const { room } = this.state;
		const { toggleRoomE2EEncryptionPermission } = this.props;
		const { rid } = room;
		const permissions = await hasPermission([toggleRoomE2EEncryptionPermission], rid);

		const canToggleEncryption = permissions[0];
		return canToggleEncryption;
	};

	canViewMembers = async () => {
		const { room } = this.state;
		const { viewBroadcastMemberListPermission } = this.props;
		const { rid, t, broadcast } = room;
		if (broadcast) {
			const permissions = await hasPermission([viewBroadcastMemberListPermission], rid);
			if (!permissions[0]) {
				return false;
			}
		}

		// This method is executed only in componentDidMount and returns a value
		// We save the state to read in render
		const result = t === 'c' || t === 'p';
		return result;
	};

	closeLivechat = async () => {
		try {
			const {
				room: { rid, departmentId }
			} = this.state;
			const { livechatRequestComment, isMasterDetail, navigation } = this.props;
			let departmentInfo: ILivechatDepartment | undefined;
			let tagsList: ILivechatTag[] | undefined;

			if (departmentId) {
				const result = await Services.getDepartmentInfo(departmentId);
				if (result.success) {
					departmentInfo = result.department as ILivechatDepartment;
				}
			}

			if (departmentInfo?.requestTagBeforeClosingChat) {
				tagsList = await Services.getTagsList();
			}

			if (!livechatRequestComment && !departmentInfo?.requestTagBeforeClosingChat) {
				const comment = I18n.t('Chat_closed_by_agent');
				return closeLivechat({ rid, isMasterDetail, comment });
			}

			navigation.navigate('CloseLivechatView', { rid, departmentId, departmentInfo, tagsList });
		} catch (e) {
			log(e);
		}
	};

	placeOnHoldLivechat = () => {
		const { navigation } = this.props;
		const { room } = this.state;
		showConfirmationAlert({
			title: I18n.t('Are_you_sure_question_mark'),
			message: I18n.t('Would_like_to_place_on_hold'),
			confirmationText: I18n.t('Yes'),
			onPress: async () => {
				try {
					await Services.onHoldLivechat(room.rid);
					navigation.navigate('RoomsListView');
				} catch (e: any) {
					showErrorAlert(e.data?.error, I18n.t('Oops'));
				}
			}
		});
	};

	returnLivechat = () => {
		const {
			room: { rid }
		} = this.state;
		showConfirmationAlert({
			message: I18n.t('Would_you_like_to_return_the_inquiry'),
			confirmationText: I18n.t('Yes'),
			onPress: async () => {
				try {
					await Services.returnLivechat(rid);
				} catch (e: any) {
					showErrorAlert(e.reason, I18n.t('Oops'));
				}
			}
		});
	};

	updateRoomMember = async () => {
		const { room } = this.state;

		try {
			if (!isGroupChat(room)) {
				const roomUserId = getUidDirectMessage(room);
				const result = await Services.getUserInfo(roomUserId);
				if (result.success) {
					this.setState({ member: result.user as any });
				}
			}
		} catch (e) {
			log(e);
			this.setState({ member: {} });
		}
	};

	toggleBlockUser = async () => {
		logEvent(events.RA_TOGGLE_BLOCK_USER);
		const { room } = this.state;
		const { rid, blocker } = room;
		const { member } = this.state;
		try {
			await Services.toggleBlockUser(rid, member._id as string, !blocker);
		} catch (e) {
			logEvent(events.RA_TOGGLE_BLOCK_USER_F);
			log(e);
		}
	};

	handleReportUser = () => {
		const { navigation } = this.props;
		const { member } = this.state;
		const { name, _id: userId, username } = member;
		if (!name || !userId || !username) {
			return;
		}
		navigation.navigate('ReportUserView', {
			name,
			userId,
			username
		});
	};

	handleShare = () => {
		logEvent(events.RA_SHARE);
		const { room } = this.state;
		const permalink = getPermalinkChannel(room);
		if (!permalink) {
			return;
		}
		Share.share({
			message: permalink
		});
	};

	leaveChannel = () => {
		const { room } = this.state;
		const { dispatch } = this.props;

		showConfirmationAlert({
			message: I18n.t('Are_you_sure_you_want_to_leave_the_room', { room: getRoomTitle(room) }),
			confirmationText: I18n.t('Yes_action_it', { action: I18n.t('leave') }),
			onPress: () => dispatch(leaveRoom(ERoomType.c, room))
		});
	};

	convertTeamToChannel = async () => {
		const { room } = this.state;
		const { navigation, userId } = this.props;

		try {
			if (!room.teamId) {
				return;
			}
			this.setState({ loading: true });
			const result = await Services.teamListRoomsOfUser({ teamId: room.teamId, userId });

			if (result.success) {
				if (result.rooms?.length) {
					const teamChannels = result.rooms.map(r => ({
						rid: r._id,
						name: r.name,
						teamId: r.teamId
					}));
					navigation.navigate('SelectListView', {
						title: 'Converting_Team_To_Channel',
						data: teamChannels,
						infoText: 'Select_Team_Channels_To_Delete',
						nextAction: (data: string[]) => this.convertTeamToChannelConfirmation(data)
					});
				} else {
					this.convertTeamToChannelConfirmation();
				}
			}
			this.setState({ loading: false });
		} catch (e) {
			this.convertTeamToChannelConfirmation();
		}
	};

	handleConvertTeamToChannel = async (selected: string[]) => {
		logEvent(events.RA_CONVERT_TEAM_TO_CHANNEL);
		try {
			const { room } = this.state;
			const { navigation } = this.props;

			if (!room.teamId) {
				return;
			}
			const result = await Services.convertTeamToChannel({ teamId: room.teamId, selected });

			if (result.success) {
				navigation.navigate('RoomView');
			}
		} catch (e) {
			logEvent(events.RA_CONVERT_TEAM_TO_CHANNEL_F);
			log(e);
		}
	};

	convertTeamToChannelConfirmation = (selected: string[] = []) => {
		showConfirmationAlert({
			title: I18n.t('Confirmation'),
			message: I18n.t('You_are_converting_the_team'),
			confirmationText: I18n.t('Convert'),
			onPress: () => this.handleConvertTeamToChannel(selected)
		});
	};

	leaveTeam = async () => {
		const { room } = this.state;
		const { navigation, dispatch, userId } = this.props;

		try {
			if (!room.teamId) {
				return;
			}
			this.setState({ loading: true });
			const result = await Services.teamListRoomsOfUser({ teamId: room.teamId, userId });

			if (result.success) {
				if (result.rooms?.length) {
					const teamChannels = result.rooms.map(r => ({
						rid: r._id,
						name: r.name,
						teamId: r.teamId,
						alert: r.isLastOwner
					}));
					navigation.navigate('SelectListView', {
						title: 'Leave_Team',
						data: teamChannels as any,
						infoText: 'Select_Team_Channels',
						nextAction: data => dispatch(leaveRoom(ERoomType.t, room, data)),
						showAlert: () => showErrorAlert(I18n.t('Last_owner_team_room'), I18n.t('Cannot_leave'))
					});
				} else {
					showConfirmationAlert({
						message: I18n.t('You_are_leaving_the_team', { team: getRoomTitle(room) }),
						confirmationText: I18n.t('Yes_action_it', { action: I18n.t('leave') }),
						onPress: () => dispatch(leaveRoom(ERoomType.t, room))
					});
				}
			}
			this.setState({ loading: false });
		} catch (e) {
			showConfirmationAlert({
				message: I18n.t('You_are_leaving_the_team', { team: getRoomTitle(room) }),
				confirmationText: I18n.t('Yes_action_it', { action: I18n.t('leave') }),
				onPress: () => dispatch(leaveRoom(ERoomType.t, room))
			});
		}
	};

	handleConvertToTeam = async () => {
		logEvent(events.RA_CONVERT_TO_TEAM);
		try {
			const { room } = this.state;
			const { navigation } = this.props;
			const result = await Services.convertChannelToTeam({ rid: room.rid, name: room.name, type: room.t as any });

			if (result.success) {
				navigation.navigate('RoomView');
			}
		} catch (e) {
			logEvent(events.RA_CONVERT_TO_TEAM_F);
			log(e);
		}
	};

	convertToTeam = () => {
		showConfirmationAlert({
			title: I18n.t('Confirmation'),
			message: I18n.t('Convert_to_Team_Warning'),
			confirmationText: I18n.t('Convert'),
			onPress: () => this.handleConvertToTeam()
		});
	};

	handleMoveToTeam = async (selected: string[]) => {
		logEvent(events.RA_MOVE_TO_TEAM);
		try {
			const { room } = this.state;
			const { navigation } = this.props;
			const result = await Services.addRoomsToTeam({ teamId: selected?.[0], rooms: [room.rid] });
			if (result.success) {
				navigation.navigate('RoomView');
			}
		} catch (e) {
			logEvent(events.RA_MOVE_TO_TEAM_F);
			log(e);
			showErrorAlert(I18n.t('There_was_an_error_while_action', { action: I18n.t('moving_channel_to_team') }));
		}
	};

	moveToTeam = async () => {
		try {
			const { navigation } = this.props;
			const db = database.active;
			const subCollection = db.get('subscriptions');
			const teamRooms = await subCollection.query(Q.where('team_main', true)).fetch();

			if (teamRooms.length) {
				const data = teamRooms.map(team => ({
					rid: team.teamId as string,
					t: team.t,
					name: team.name,
					teamMain: team.teamMain
				}));
				navigation.navigate('SelectListView', {
					title: 'Move_to_Team',
					infoText: 'Move_Channel_Paragraph',
					nextAction: () => {
						navigation.push('SelectListView', {
							title: 'Select_Team',
							data,
							isRadio: true,
							isSearch: true,
							onSearch: onChangeText => this.searchTeam(onChangeText),
							nextAction: selected =>
								showConfirmationAlert({
									title: I18n.t('Confirmation'),
									message: I18n.t('Move_to_Team_Warning'),
									confirmationText: I18n.t('Yes_action_it', { action: I18n.t('move') }),
									onPress: () => this.handleMoveToTeam(selected)
								})
						});
					}
				});
			}
		} catch (e) {
			log(e);
		}
	};

	searchTeam = async (onChangeText: string) => {
		logEvent(events.RA_SEARCH_TEAM);
		try {
			const QUERY_SIZE = 50;
			const db = database.active;
			const teams = await db
				.get('subscriptions')
				.query(
					Q.where('team_main', true),
					Q.where('name', Q.like(`%${onChangeText}%`)),
					Q.take(QUERY_SIZE),
					Q.sortBy('room_updated_at', Q.desc)
				)
				.fetch();

			const asyncFilter = async (teamArray: TSubscriptionModel[]) => {
				const results = await Promise.all(
					teamArray.map(async team => {
						const result = await this.hasMoveToTeamPermission(team.rid);
						return result;
					})
				);

				return teamArray.filter((_v, index) => results[index]);
			};
			const teamsFiltered = await asyncFilter(teams);
			return teamsFiltered;
		} catch (e) {
			log(e);
		}
	};

	renderRoomInfo = () => {
		const { room, member } = this.state;
		const { rid, name, t, topic, source } = room;
		const { theme, fontScale } = this.props;

		const avatar = getRoomAvatar(room);
		const isGroupChatHandler = isGroupChat(room);

		return (
			<List.Section>
				<List.Separator />
				<Touch
					onPress={() =>
						this.onPressTouchable({
							route: 'RoomInfoView',
							// forward room only if room isn't joined
							params: {
								rid,
								t,
								room: room.asPlain ? room.asPlain() : room,
								member,
								fromRid: room?.rid
							}
						})
					}
					style={{ backgroundColor: themes[theme].surfaceRoom }}
					accessibilityLabel={I18n.t('Room_Info')}
					enabled={!isGroupChatHandler}
					testID='room-actions-info'>
					<View style={[styles.roomInfoContainer, { height: 72 * fontScale }]}>
						<Avatar text={avatar} style={styles.avatar} size={50 * fontScale} type={t} rid={rid}>
							{t === 'd' && member._id ? (
								<View style={[sharedStyles.status, { backgroundColor: themes[theme].surfaceRoom }]}>
									<Status size={16} id={member._id} />
								</View>
							) : undefined}
						</Avatar>
						<View style={styles.roomTitleContainer}>
							{room.t === 'd' ? (
								<Text style={[styles.roomTitle, { color: themes[theme].fontTitlesLabels }]} numberOfLines={1}>
									{room.fname}
								</Text>
							) : (
								<View style={styles.roomTitleRow}>
									<RoomTypeIcon
										type={room.prid ? 'discussion' : room.t}
										teamMain={room.teamMain}
										status={room.visitor?.status}
										sourceType={source}
									/>
									<Text style={[styles.roomTitle, { color: themes[theme].fontTitlesLabels }]} numberOfLines={1}>
										{getRoomTitle(room)}
									</Text>
								</View>
							)}
							<MarkdownPreview
								msg={t === 'd' ? `@${name}` : topic}
								style={[styles.roomDescription, { color: themes[theme].fontSecondaryInfo }]}
							/>
							{room.t === 'd' && (
								<MarkdownPreview
									msg={member.statusText}
									style={[styles.roomDescription, { color: themes[theme].fontSecondaryInfo }]}
								/>
							)}
						</View>
						{isGroupChatHandler ? null : <List.Icon name='chevron-right' style={styles.actionIndicator} />}
					</View>
				</Touch>
				<List.Separator />
			</List.Section>
		);
	};

	renderE2EEncryption = () => {
		const { room, canToggleEncryption, canEdit } = this.state;

		const { serverVersion } = this.props;
		let hasPermission = false;
		if (compareServerVersion(serverVersion, 'lowerThan', '3.11.0')) {
			hasPermission = canEdit;
		} else {
			hasPermission = canToggleEncryption;
		}

		if (E2E_ROOM_TYPES[room.t]) {
			return (
				<List.Section>
					<List.Separator />
					<List.Item
						title='E2E_Encryption'
						subtitle={room.encrypted ? 'Enabled' : 'Disabled'}
						left={() => <List.Icon name='encrypted' />}
						onPress={() =>
							this.onPressTouchable({
								route: 'E2EEToggleRoomView',
								params: {
									rid: room.rid
								}
							})
						}
						disabled={!hasPermission}
						showActionIndicator
					/>
					<List.Separator />
				</List.Section>
			);
		}
		return null;
	};

	renderLastSection = () => {
		const { room, joined, loading } = this.state;
		const { theme } = this.props;
		const { t, blocker } = room;

		if (!joined || t === 'l') {
			return null;
		}

		if (t === 'd' && !isGroupChat(room)) {
			return (
				<>
					<List.Section>
						<List.Separator />
						<List.Item
							title={`${blocker ? 'Unblock' : 'Block'}`}
							onPress={() =>
								this.onPressTouchable({
									event: this.toggleBlockUser
								})
							}
							testID='room-actions-block-user'
							left={() => <List.Icon name='ignore' />}
							showActionIndicator
						/>
						<List.Separator />
					</List.Section>
					<List.Section>
						<List.Separator />
						<List.Item
							title={'Report'}
							onPress={() =>
								this.onPressTouchable({
									event: this.handleReportUser
								})
							}
							testID='room-actions-block-user'
							left={() => <List.Icon name='warning' color={themes[theme].buttonBackgroundDangerDefault} />}
							showActionIndicator
							color={themes[theme].buttonBackgroundDangerDefault}
						/>
						<List.Separator />
					</List.Section>
				</>
			);
		}

		if (t === 'p' || t === 'c') {
			return (
				<List.Section>
					<List.Separator />
					<List.Item
						disabled={loading}
						title='Leave'
						onPress={() =>
							this.onPressTouchable({
								event: room.teamMain ? this.leaveTeam : this.leaveChannel
							})
						}
						testID='room-actions-leave-channel'
						left={() => <List.Icon name='logout' color={themes[theme].buttonBackgroundDangerDefault} />}
						showActionIndicator
						color={themes[theme].buttonBackgroundDangerDefault}
					/>
					<List.Separator />
				</List.Section>
			);
		}

		return null;
	};

	teamChannelActions = (t: string, room: ISubscription) => {
		const { canEdit, canCreateTeam, canAddChannelToTeam, hasE2EEWarning } = this.state;
		const canConvertToTeam = canEdit && canCreateTeam && !room.teamMain;
		const canMoveToTeam = canEdit && canAddChannelToTeam && !room.teamId;

		return (
			<>
				{['c', 'p'].includes(t) && canConvertToTeam ? (
					<>
						<List.Item
							title='Convert_to_Team'
							onPress={() =>
								this.onPressTouchable({
									event: this.convertToTeam
								})
							}
							testID='room-actions-convert-to-team'
							left={() => <List.Icon name='teams' />}
							showActionIndicator
							disabled={hasE2EEWarning}
						/>
						<List.Separator />
					</>
				) : null}

				{['c', 'p'].includes(t) && canMoveToTeam ? (
					<>
						<List.Item
							title='Move_to_Team'
							onPress={() =>
								this.onPressTouchable({
									event: this.moveToTeam
								})
							}
							testID='room-actions-move-to-team'
							left={() => <List.Icon name='channel-move-to-team' />}
							showActionIndicator
							disabled={hasE2EEWarning}
						/>
						<List.Separator />
					</>
				) : null}
			</>
		);
	};

	teamToChannelActions = (t: string, room: ISubscription) => {
		const { canEdit, canConvertTeam, loading, hasE2EEWarning } = this.state;
		const canConvertTeamToChannel = canEdit && canConvertTeam && !!room?.teamMain;

		return (
			<>
				{['c', 'p'].includes(t) && canConvertTeamToChannel ? (
					<>
						<List.Item
							title='Convert_to_Channel'
							disabled={loading || hasE2EEWarning}
							onPress={() =>
								this.onPressTouchable({
									event: this.convertTeamToChannel
								})
							}
							left={() => <List.Icon name='channel-public' />}
							showActionIndicator
						/>
						<List.Separator />
					</>
				) : null}
			</>
		);
	};

	renderOmnichannelSection = () => {
		const { room } = this.state;
		const { rid, t } = room;
		const { theme } = this.props;

		if (t !== 'l' || this.isOmnichannelPreview) {
			return null;
		}

		return (
			<List.Section>
				{this.omnichannelPermissions?.canForwardGuest ? (
					<>
						<List.Item
							title='Forward'
							onPress={() =>
								this.onPressTouchable({
									route: 'ForwardLivechatView',
									params: { rid }
								})
							}
							left={() => <List.Icon name='chat-forward' color={themes[theme].fontTitlesLabels} />}
							showActionIndicator
						/>
						<List.Separator />
					</>
				) : null}

				{this.omnichannelPermissions?.canPlaceLivechatOnHold ? (
					<>
						<List.Item
							title='Place_chat_on_hold'
							onPress={() =>
								this.onPressTouchable({
									event: this.placeOnHoldLivechat
								})
							}
							left={() => <List.Icon name='pause' color={themes[theme].fontTitlesLabels} />}
							showActionIndicator
						/>
						<List.Separator />
					</>
				) : null}

				{this.omnichannelPermissions?.canReturnQueue ? (
					<>
						<List.Item
							title='Return_to_waiting_line'
							onPress={() =>
								this.onPressTouchable({
									event: this.returnLivechat
								})
							}
							left={() => <List.Icon name='move-to-the-queue' color={themes[theme].fontTitlesLabels} />}
							showActionIndicator
						/>
						<List.Separator />
					</>
				) : null}

				<>
					<List.Item
						title='Close'
						color={themes[theme].buttonBackgroundDangerDefault}
						onPress={() =>
							this.onPressTouchable({
								event: this.closeLivechat
							})
						}
						left={() => <List.Icon name='chat-close' color={themes[theme].buttonBackgroundDangerDefault} />}
						showActionIndicator
					/>
					<List.Separator />
				</>
			</List.Section>
		);
	};

	render() {
		const { room, membersCount, canViewMembers, joined, canAutoTranslate, hasE2EEWarning } = this.state;
		const { isMasterDetail, navigation } = this.props;
		const { rid, t, prid, teamId } = room;
		const isGroupChatHandler = isGroupChat(room);

		return (
			<SafeAreaView testID='room-actions-view'>
				<StatusBar />
				<List.Container testID='room-actions-scrollview'>
					{this.renderRoomInfo()}
					<CallSection rid={rid} disabled={hasE2EEWarning} />
					{this.renderE2EEncryption()}
					<List.Section>
						<List.Separator />

						{(['c', 'p'].includes(t) && canViewMembers) || isGroupChatHandler ? (
							<>
								<List.Item
									title='Members'
									subtitle={membersCount && membersCount > 0 ? `${membersCount} ${I18n.t('members')}` : undefined}
									onPress={() => this.onPressTouchable({ route: 'RoomMembersView', params: { rid, room, joined: this.joined } })}
									testID='room-actions-members'
									left={() => <List.Icon name='team' />}
									showActionIndicator
									translateSubtitle={false}
								/>
								<List.Separator />
							</>
						) : null}

						{['c', 'p', 'd'].includes(t) && !prid ? (
							<>
								<List.Item
									title='Discussions'
									onPress={() =>
										this.onPressTouchable({
											route: 'DiscussionsView',
											params: {
												rid,
												t
											}
										})
									}
									testID='room-actions-discussions'
									left={() => <List.Icon name='discussions' />}
									showActionIndicator
									disabled={hasE2EEWarning}
								/>
								<List.Separator />
							</>
						) : null}
						{teamId && isTeamRoom({ teamId, joined }) ? (
							<>
								<List.Item
									title='Channels'
									onPress={() => {
										logEvent(events.ROOM_GO_TEAM_CHANNELS);
										if (isMasterDetail) {
											// @ts-ignore TODO: find a way to make this work - OLD Diego :)
											navigation.navigate('ModalStackNavigator', {
												screen: 'TeamChannelsView',
												params: { teamId, joined }
											});
										} else {
											navigation.navigate('TeamChannelsView', {
												teamId,
												joined
											});
										}
									}}
									testID='room-actions-teams'
									left={() => <List.Icon name='channel-public' />}
									showActionIndicator
									disabled={hasE2EEWarning}
								/>
								<List.Separator />
							</>
						) : null}
						{['l'].includes(t) && !this.isOmnichannelPreview && this.omnichannelPermissions?.canViewCannedResponse ? (
							<>
								<List.Item
									title='Canned_Responses'
									onPress={() => this.onPressTouchable({ route: 'CannedResponsesListView', params: { rid } })}
									left={() => <List.Icon name='canned-response' />}
									showActionIndicator
								/>
								<List.Separator />
							</>
						) : null}

						{['c', 'p', 'd'].includes(t) ? (
							<>
								<List.Item
									title='Files'
									onPress={() =>
										this.onPressTouchable({
											route: 'MessagesView',
											params: { rid, t, name: 'Files' }
										})
									}
									testID='room-actions-files'
									left={() => <List.Icon name='attach' />}
									showActionIndicator
									disabled={hasE2EEWarning}
								/>
								<List.Separator />
							</>
						) : null}

						{['c', 'p', 'd'].includes(t) ? (
							<>
								<List.Item
									title='Mentions'
									onPress={() =>
										this.onPressTouchable({
											route: 'MessagesView',
											params: { rid, t, name: 'Mentions' }
										})
									}
									testID='room-actions-mentioned'
									left={() => <List.Icon name='mention' />}
									showActionIndicator
									disabled={hasE2EEWarning}
								/>
								<List.Separator />
							</>
						) : null}

						{['c', 'p', 'd'].includes(t) ? (
							<>
								<List.Item
									title='Starred'
									onPress={() =>
										this.onPressTouchable({
											route: 'MessagesView',
											params: { rid, t, name: 'Starred' }
										})
									}
									testID='room-actions-starred'
									left={() => <List.Icon name='star' />}
									showActionIndicator
									disabled={hasE2EEWarning}
								/>
								<List.Separator />
							</>
						) : null}

						{['c', 'p', 'd'].includes(t) ? (
							<>
								<List.Item
									title='Share'
									onPress={() =>
										this.onPressTouchable({
											event: this.handleShare
										})
									}
									testID='room-actions-share'
									left={() => <List.Icon name='share' />}
									showActionIndicator
									disabled={hasE2EEWarning}
								/>
								<List.Separator />
							</>
						) : null}

						{['c', 'p', 'd'].includes(t) ? (
							<>
								<List.Item
									title='Pinned'
									onPress={() =>
										this.onPressTouchable({
											route: 'MessagesView',
											params: { rid, t, name: 'Pinned' }
										})
									}
									testID='room-actions-pinned'
									left={() => <List.Icon name='pin' />}
									showActionIndicator
									disabled={hasE2EEWarning}
								/>
								<List.Separator />
							</>
						) : null}

						{['c', 'p', 'd'].includes(t) && canAutoTranslate ? (
							<>
								<List.Item
									title='Auto_Translate'
									onPress={() =>
										this.onPressTouchable({
											route: 'AutoTranslateView',
											params: { rid, room }
										})
									}
									testID='room-actions-auto-translate'
									left={() => <List.Icon name='language' />}
									showActionIndicator
									disabled={hasE2EEWarning}
								/>
								<List.Separator />
							</>
						) : null}

						{['c', 'p', 'd'].includes(t) && joined ? (
							<>
								<List.Item
									title='Notifications'
									onPress={() =>
										this.onPressTouchable({
											route: 'NotificationPrefView',
											params: { rid, room }
										})
									}
									testID='room-actions-notifications'
									left={() => <List.Icon name='notification' />}
									showActionIndicator
									disabled={hasE2EEWarning}
								/>
								<List.Separator />
							</>
						) : null}

						{this.teamChannelActions(t, room)}
						{this.teamToChannelActions(t, room)}
					</List.Section>
					{this.renderOmnichannelSection()}
					{this.renderLastSection()}
				</List.Container>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	userId: getUserSelector(state).id,
	encryptionEnabled: state.encryption.enabled,
	serverVersion: state.server.version,
	isMasterDetail: state.app.isMasterDetail,
	editRoomPermission: state.permissions['edit-room'],
	toggleRoomE2EEncryptionPermission: state.permissions['toggle-room-e2e-encryption'],
	viewBroadcastMemberListPermission: state.permissions['view-broadcast-member-list'],
	createTeamPermission: state.permissions['create-team'],
	addTeamChannelPermission: state.permissions['add-team-channel'],
	moveRoomToTeamPermission: state.permissions['move-room-to-team'],
	convertTeamPermission: state.permissions['convert-team'],
	viewCannedResponsesPermission: state.permissions['view-canned-responses'],
	livechatAllowManualOnHold: state.settings.Livechat_allow_manual_on_hold as boolean,
	livechatRequestComment: state.settings.Livechat_request_comment_when_closing_conversation as boolean
});

export default connect(mapStateToProps)(withTheme(withActionSheet(withDimensions(RoomActionsView))));
