import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { dequal } from 'dequal';
import { Component, useLayoutEffect, useMemo } from 'react';
import { connect, shallowEqual } from 'react-redux';
import { type Dispatch } from 'redux';
import { type Observable, type Subscription } from 'rxjs';

import { type TActionSheetOptionsItem } from '~/containers/ActionSheet';
import * as HeaderButton from '~/containers/Header/components/HeaderButton';
import {
	type IApplicationState,
	type ISubscription,
	type SubscriptionType,
	type TMessageModel,
	type TSubscriptionModel,
	type TUserStatus
} from '~/definitions';
import { type ILivechatDepartment } from '~/definitions/ILivechatDepartment';
import { type ILivechatTag } from '~/definitions/ILivechatTag';
import i18n from '~/i18n';
import database from '~/lib/database';
import { hasPermission, showConfirmationAlert, showErrorAlert } from '~/lib/methods/helpers';
import { getUidDirectMessage } from '~/lib/methods/helpers/helpers';
import { closeLivechat as closeLivechatService } from '~/lib/methods/helpers/closeLivechat';
import { events, logEvent } from '~/lib/methods/helpers/log';
import { getDepartmentInfo, getTagsList, onHoldLivechat, returnLivechat } from '~/lib/services/restApi';
import { getUserSelector } from '~/selectors/login';
import { type TNavigation } from '~/stacks/stackType';
import { type ChatsStackParamList } from '~/stacks/types';
import { useHeaderCallAction } from './components/useHeaderCallAction';
import { headerItems, type HeaderAction } from '~/lib/methods/helpers/navigation';
import { getUnreadStyle } from '~/containers/UnreadBadge/getUnreadStyle';
import { type TColors, type TSupportedThemes, withTheme } from '~/theme';
import getRoomAccessibilityLabel from '~/lib/helpers/getRoomAccessibilityLabel';
import { withMasterDetail } from '~/lib/hooks/useMasterDetail';

interface IRightButtonsProps extends Pick<ISubscription, 't'> {
	userId?: string;
	threadsEnabled: boolean;
	tmid?: string;
	teamId?: string;
	roomName?: string;
	teamMain?: boolean;
	isGroupChat?: boolean;
	isMasterDetail: boolean;
	toggleFollowThread: Function;
	joined: boolean;
	status?: string;
	dispatch: Dispatch;
	encrypted?: boolean;
	navigation: NativeStackNavigationProp<ChatsStackParamList & TNavigation, 'RoomView'>;
	omnichannelPermissions: {
		canForwardGuest: boolean;
		canReturnQueue: boolean;
		canPlaceLivechatOnHold: boolean;
	};
	livechatRequestComment: boolean;
	showActionSheet: Function;
	departmentId?: string;
	rid?: string;
	theme?: TSupportedThemes;
	colors?: TColors;
	issuesWithNotifications: boolean;
	notificationsDisabled?: boolean;
	hasE2EEWarning: boolean;
	toggleRoomE2EEncryptionPermission?: string[];
}

interface IRigthButtonsState {
	isFollowingThread: boolean;
	tunread: string[];
	tunreadUser: string[];
	tunreadGroup: string[];
	canToggleEncryption: boolean;
	isSelfDm: boolean;
}

class RightButtonsContainer extends Component<IRightButtonsProps, IRigthButtonsState> {
	private threadSubscription?: Subscription;
	private subSubscription?: Subscription;
	private room?: TSubscriptionModel;

	constructor(props: IRightButtonsProps) {
		super(props);
		this.state = {
			isFollowingThread: true,
			tunread: [],
			tunreadUser: [],
			tunreadGroup: [],
			canToggleEncryption: false,
			isSelfDm: false
		};
	}

	async componentDidMount() {
		const { tmid, rid, hasE2EEWarning } = this.props;
		const db = database.active;
		if (tmid) {
			try {
				const threadRecord = await db.get('messages').find(tmid);
				this.observeThread(threadRecord);
			} catch (e) {
				console.log("Can't find message to observe.");
			}
		}
		if (rid) {
			try {
				const subCollection = db.get('subscriptions');
				this.room = await subCollection.find(rid);
				this.observeSubscription(this.room);
			} catch (e) {
				console.log("Can't find subscription to observe.");
			}
		}
		if (hasE2EEWarning) {
			this.setCanToggleEncryption();
		}
	}

	shouldComponentUpdate(nextProps: IRightButtonsProps, nextState: IRigthButtonsState) {
		const { omnichannelPermissions, toggleRoomE2EEncryptionPermission, ...props } = this.props;
		const {
			omnichannelPermissions: nextOmnichannelPermissions,
			toggleRoomE2EEncryptionPermission: nextToggleRoomE2EEncryptionPermission,
			...otherNextProps
		} = nextProps;
		return (
			!shallowEqual(props, otherNextProps) ||
			!dequal(omnichannelPermissions, nextOmnichannelPermissions) ||
			!dequal(toggleRoomE2EEncryptionPermission, nextToggleRoomE2EEncryptionPermission) ||
			!dequal(this.state, nextState)
		);
	}

	componentDidUpdate(prevProps: Readonly<IRightButtonsProps>): void {
		const { toggleRoomE2EEncryptionPermission, hasE2EEWarning } = this.props;
		if (
			(!prevProps.hasE2EEWarning && hasE2EEWarning) ||
			!dequal(prevProps.toggleRoomE2EEncryptionPermission, toggleRoomE2EEncryptionPermission)
		) {
			this.setCanToggleEncryption();
		}
	}

	componentWillUnmount() {
		if (this.threadSubscription && this.threadSubscription.unsubscribe) {
			this.threadSubscription.unsubscribe();
		}
		if (this.subSubscription && this.subSubscription.unsubscribe) {
			this.subSubscription.unsubscribe();
		}
	}

	observeThread = (threadRecord: TMessageModel) => {
		const threadObservable: Observable<TMessageModel> = threadRecord.observe();
		this.threadSubscription = threadObservable.subscribe(thread => this.updateThread(thread));
	};

	updateThread = (thread: TMessageModel) => {
		const { userId } = this.props;
		this.setState({
			isFollowingThread: (thread.replies && !!thread.replies.find(t => t === userId)) ?? false
		});
	};

	observeSubscription = (subRecord: TSubscriptionModel) => {
		const subObservable = subRecord.observe();
		this.subSubscription = subObservable.subscribe(sub => {
			this.updateSubscription(sub);

			const { hasE2EEWarning } = this.props;
			if (hasE2EEWarning) {
				this.setCanToggleEncryption();
			}
		});
	};

	updateSubscription = (sub: TSubscriptionModel) => {
		const { userId } = this.props;
		const isSelfDm = sub?.t === 'd' && !!userId && getUidDirectMessage(sub) === userId;
		this.setState({
			tunread: sub?.tunread ?? [],
			tunreadUser: sub?.tunreadUser ?? [],
			tunreadGroup: sub?.tunreadGroup ?? [],
			isSelfDm
		});
	};

	goThreadsView = () => {
		logEvent(events.ROOM_GO_THREADS);
		const { rid, t, navigation, isMasterDetail } = this.props;
		if (!rid) {
			return;
		}
		if (isMasterDetail) {
			// @ts-ignore TODO: find a way to make this work
			navigation.navigate('ModalStackNavigator', { screen: 'ThreadMessagesView', params: { rid, t } });
		} else {
			navigation.navigate('ThreadMessagesView', { rid, t: t as SubscriptionType });
		}
	};

	returnLivechat = () => {
		const { rid, departmentId } = this.props;
		if (rid) {
			showConfirmationAlert({
				message: i18n.t('Would_you_like_to_return_the_inquiry'),
				confirmationText: i18n.t('Yes'),
				onPress: async () => {
					try {
						await returnLivechat(rid, departmentId);
					} catch (e: any) {
						showErrorAlert(e.reason, i18n.t('Oops'));
					}
				}
			});
		}
	};

	placeOnHoldLivechat = () => {
		const { navigation, rid } = this.props;
		if (rid) {
			showConfirmationAlert({
				title: i18n.t('Are_you_sure_question_mark'),
				message: i18n.t('Would_like_to_place_on_hold'),
				confirmationText: i18n.t('Yes'),
				onPress: async () => {
					try {
						await onHoldLivechat(rid);
						navigation.navigate('RoomsListView');
					} catch (e: any) {
						showErrorAlert(e.data?.error, i18n.t('Oops'));
					}
				}
			});
		}
	};

	closeLivechat = async () => {
		try {
			const { rid, departmentId } = this.props;
			const { livechatRequestComment, isMasterDetail, navigation } = this.props;
			let departmentInfo: ILivechatDepartment | undefined;
			let tagsList: ILivechatTag[] | undefined;

			if (departmentId) {
				const result = await getDepartmentInfo(departmentId);
				if (result.success) {
					departmentInfo = result.department as ILivechatDepartment;
				}
			}

			if (departmentInfo?.requestTagBeforeClosingChat) {
				tagsList = await getTagsList();
			}

			if (rid) {
				if (!livechatRequestComment && !departmentInfo?.requestTagBeforeClosingChat) {
					const comment = i18n.t('Chat_closed_by_agent');
					return closeLivechatService({ rid, isMasterDetail, comment });
				}

				if (isMasterDetail) {
					navigation.navigate('ModalStackNavigator', {
						screen: 'CloseLivechatView',
						params: { rid, departmentId, departmentInfo, tagsList }
					});
				} else {
					navigation.navigate('CloseLivechatView', { rid, departmentId, departmentInfo, tagsList });
				}
			}
		} catch {
			// do nothing
		}
	};

	getMoreActions = () => {
		const { rid, navigation, omnichannelPermissions, isMasterDetail } = this.props;

		const options = [] as TActionSheetOptionsItem[];
		if (omnichannelPermissions.canPlaceLivechatOnHold) {
			options.push({
				title: i18n.t('Place_chat_on_hold'),
				icon: 'pause',
				onPress: () => this.placeOnHoldLivechat()
			});
		}

		if (omnichannelPermissions.canForwardGuest) {
			options.push({
				title: i18n.t('Forward_Chat'),
				icon: 'chat-forward',
				onPress: () => {
					if (rid) {
						if (isMasterDetail) {
							navigation.navigate('ModalStackNavigator', {
								screen: 'ForwardLivechatView',
								params: { rid }
							});
						} else {
							navigation.navigate('ForwardLivechatView', { rid });
						}
					}
				}
			});
		}

		if (omnichannelPermissions.canReturnQueue) {
			options.push({
				title: i18n.t('Return_to_waiting_line'),
				icon: 'move-to-the-queue',
				onPress: () => this.returnLivechat()
			});
		}

		options.push({
			title: i18n.t('Close'),
			icon: 'chat-close',
			onPress: () => this.closeLivechat(),
			danger: true
		});

		return options;
	};

	showMoreActions = () => {
		logEvent(events.ROOM_SHOW_MORE_ACTIONS);
		this.props.showActionSheet({ options: this.getMoreActions() });
	};

	setCanToggleEncryption = async () => {
		const { rid } = this.props;
		const { toggleRoomE2EEncryptionPermission } = this.props;
		const permissions = await hasPermission([toggleRoomE2EEncryptionPermission], rid);

		const canToggleEncryption = permissions[0];
		this.setState({ canToggleEncryption });
	};

	navigateToNotificationOrPushTroubleshoot = () => {
		const { room } = this;
		const { rid, navigation, isMasterDetail, issuesWithNotifications } = this.props;

		if (!rid || !room) {
			return;
		}
		if (!issuesWithNotifications && room) {
			if (isMasterDetail) {
				navigation.navigate('ModalStackNavigator', {
					screen: 'NotificationPrefView',
					params: { rid, room }
				});
			} else {
				navigation.navigate('NotificationPrefView', { rid, room });
			}
		} else if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', {
				screen: 'PushTroubleshootView'
			});
		} else {
			navigation.navigate('PushTroubleshootView');
		}
	};

	goSearchView = () => {
		logEvent(events.ROOM_GO_SEARCH);
		const { rid, t, navigation, isMasterDetail, encrypted } = this.props;
		if (!rid) {
			return;
		}
		if (isMasterDetail) {
			// @ts-ignore TODO: find a way to make this work
			navigation.navigate('ModalStackNavigator', {
				screen: 'SearchMessagesView',
				params: { rid, showCloseModal: true, encrypted }
			});
		} else {
			navigation.navigate('SearchMessagesView', { rid, t: t as SubscriptionType, encrypted });
		}
	};

	goE2EEToggleRoomView = () => {
		logEvent(events.ROOM_GO_SEARCH);
		const { rid, navigation, isMasterDetail } = this.props;
		if (!rid) {
			return;
		}
		if (isMasterDetail) {
			// @ts-ignore TODO: find a way to make this work
			navigation.navigate('ModalStackNavigator', {
				screen: 'E2EEToggleRoomView',
				params: { rid }
			});
		} else {
			// @ts-ignore
			navigation.navigate('E2EEToggleRoomView', { rid });
		}
	};

	toggleFollowThread = () => {
		logEvent(events.ROOM_TOGGLE_FOLLOW_THREADS);
		const { isFollowingThread } = this.state;
		const { toggleFollowThread } = this.props;
		if (toggleFollowThread) {
			toggleFollowThread(isFollowingThread);
		}
	};

	isOmnichannelPreview = () => {
		const { status } = this.props;
		return status === 'queued';
	};

	threadsAccessibilityLabel = () => {
		const { tunreadGroup, tunreadUser, tunread } = this.state;

		if (!tunread.length) {
			return i18n.t('Threads');
		}
		if (tunreadUser?.length) {
			return i18n.t('Threads_dm_unread', { unread: tunreadUser?.length });
		}
		if (tunreadGroup?.length) {
			return i18n.t('Threads_group_unread', { unread: tunreadGroup?.length });
		}
		return i18n.t('Threads_unread', { unread: tunread?.length });
	};

	render() {
		const { isFollowingThread, tunread, tunreadUser, tunreadGroup, canToggleEncryption, isSelfDm } = this.state;
		const {
			t,
			tmid,
			threadsEnabled,
			rid,
			colors,
			theme,
			issuesWithNotifications,
			notificationsDisabled,
			hasE2EEWarning,
			roomName,
			userId,
			isGroupChat,
			status,
			teamMain,
			navigation
		} = this.props;
		const beforeCall: HeaderAction[] = [];
		const afterCall: HeaderAction[] = [];

		if (!rid || status === 'INVITED' || (t === 'l' && this.isOmnichannelPreview())) {
			return <ApplyRoomHeaderItems navigation={navigation} actions={beforeCall} />;
		}
		if (t === 'l') {
			beforeCall.push({
				type: 'menu',
				label: i18n.t('More'),
				accessibilityLabel: i18n.t('More'),
				icon: { type: 'sfSymbol', name: 'ellipsis' },
				menu: {
					items: this.getMoreActions().map(action => ({
						type: 'action',
						label: action.title,
						onPress: action.onPress,
						destructive: action.danger
					}))
				},
				androidElement: (
					<HeaderButton.Item iconName='kebab' onPress={this.showMoreActions} testID='room-view-header-omnichannel-kebab' />
				)
			});
			return <ApplyRoomHeaderItems navigation={navigation} actions={beforeCall} />;
		}
		if (tmid) {
			beforeCall.push({
				type: 'button',
				label: i18n.t(isFollowingThread ? 'Unfollow_thread' : 'Follow_thread'),
				iconName: isFollowingThread ? 'notification' : 'notification-disabled',
				onPress: this.toggleFollowThread,
				testID: isFollowingThread ? 'room-view-header-unfollow' : 'room-view-header-follow'
			});
			return <ApplyRoomHeaderItems navigation={navigation} actions={beforeCall} />;
		}
		if (hasE2EEWarning) {
			beforeCall.push({
				type: 'button',
				label: i18n.t('E2E_Encryption'),
				iconName: 'encrypted',
				onPress: this.goE2EEToggleRoomView,
				disabled: !canToggleEncryption,
				testID: 'room-view-header-encryption'
			});
		}
		if (issuesWithNotifications || notificationsDisabled) {
			beforeCall.push({
				type: 'button',
				label: i18n.t('Notifications'),
				iconName: 'notification-disabled',
				tintColor: issuesWithNotifications ? colors!.fontDanger : undefined,
				onPress: this.navigateToNotificationOrPushTroubleshoot,
				disabled: hasE2EEWarning,
				testID: 'room-view-push-troubleshoot'
			});
		}
		if (threadsEnabled) {
			const badge = () => <HeaderButton.BadgeUnread tunread={tunread} tunreadUser={tunreadUser} tunreadGroup={tunreadGroup} />;
			afterCall.push({
				type: 'button',
				label: this.threadsAccessibilityLabel(),
				iconName: 'threads',
				onPress: this.goThreadsView,
				disabled: hasE2EEWarning,
				testID: 'room-view-header-threads',
				androidBadge: badge,
				badge: tunread.length
					? {
							value: tunread.length >= 100 ? '+99' : tunread.length,
							style: getUnreadStyle({ theme: theme!, tunread, tunreadUser, tunreadGroup })
						}
					: undefined
			});
		}
		afterCall.push({
			type: 'button',
			label: i18n.t('Search_Messages'),
			iconName: 'search',
			onPress: this.goSearchView,
			testID: 'room-view-search',
			disabled: hasE2EEWarning
		});
		if (isSelfDm) {
			return <ApplyRoomHeaderItems navigation={navigation} actions={[...beforeCall, ...afterCall]} />;
		}
		const accessibilityRoomName =
			!isGroupChat && t === 'd' && !!userId
				? roomName
				: getRoomAccessibilityLabel({ type: t, userId, isGroupChat, status: status as TUserStatus, teamMain });
		return (
			<RoomHeaderItemsWithCall
				navigation={navigation}
				beforeCall={beforeCall}
				afterCall={afterCall}
				rid={rid}
				disabled={hasE2EEWarning}
				accessibilityLabel={i18n.t('Call_room_name', { roomName: accessibilityRoomName })}
			/>
		);
	}
}

interface IApplyRoomHeaderItems {
	navigation: IRightButtonsProps['navigation'];
	actions: HeaderAction[];
}

const ApplyRoomHeaderItems = ({ navigation, actions }: IApplyRoomHeaderItems) => {
	useLayoutEffect(() => {
		navigation.setOptions(headerItems({ right: actions }));
	}, [navigation, actions]);
	return null;
};

const RoomHeaderItemsWithCall = ({
	navigation,
	beforeCall,
	afterCall,
	rid,
	disabled,
	accessibilityLabel
}: {
	navigation: IRightButtonsProps['navigation'];
	beforeCall: HeaderAction[];
	afterCall: HeaderAction[];
	rid: string;
	disabled: boolean;
	accessibilityLabel: string;
}) => {
	const call = useHeaderCallAction({ rid, disabled, accessibilityLabel });
	const actions = useMemo(() => [...beforeCall, ...(call ? [call] : []), ...afterCall], [beforeCall, call, afterCall]);
	return <ApplyRoomHeaderItems navigation={navigation} actions={actions} />;
};

const mapStateToProps = (state: IApplicationState) => ({
	userId: getUserSelector(state).id,
	threadsEnabled: state.settings.Threads_enabled as boolean,
	livechatRequestComment: state.settings.Livechat_request_comment_when_closing_conversation as boolean,
	issuesWithNotifications: state.troubleshootingNotification.issuesWithNotifications,
	toggleRoomE2EEncryptionPermission: state.permissions['toggle-room-e2e-encryption']
});

export default connect(mapStateToProps)(withTheme(withMasterDetail(RightButtonsContainer)));
