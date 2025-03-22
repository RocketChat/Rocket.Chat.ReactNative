import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { dequal } from 'dequal';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { Observable, Subscription } from 'rxjs';

import { TActionSheetOptionsItem } from '../../containers/ActionSheet';
import * as HeaderButton from '../../containers/HeaderButton';
import { IApplicationState, ISubscription, SubscriptionType, TMessageModel, TSubscriptionModel } from '../../definitions';
import { ILivechatDepartment } from '../../definitions/ILivechatDepartment';
import { ILivechatTag } from '../../definitions/ILivechatTag';
import i18n from '../../i18n';
import database from '../../lib/database';
import { hasPermission, showConfirmationAlert, showErrorAlert } from '../../lib/methods/helpers';
import { closeLivechat as closeLivechatService } from '../../lib/methods/helpers/closeLivechat';
import { events, logEvent } from '../../lib/methods/helpers/log';
import { Services } from '../../lib/services';
import { onHoldLivechat, returnLivechat } from '../../lib/services/restApi';
import { getUserSelector } from '../../selectors/login';
import { TNavigation } from '../../stacks/stackType';
import { ChatsStackParamList } from '../../stacks/types';
import { HeaderCallButton } from './components';
import { TColors, TSupportedThemes, withTheme } from '../../theme';

interface IRightButtonsProps extends Pick<ISubscription, 't'> {
	userId?: string;
	threadsEnabled: boolean;
	tmid?: string;
	teamId?: string;
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
	onLayout: Function;
}

interface IRigthButtonsState {
	isFollowingThread: boolean;
	tunread: string[];
	tunreadUser: string[];
	tunreadGroup: string[];
	canToggleEncryption: boolean;
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
			canToggleEncryption: false
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
		const { isFollowingThread, tunread, tunreadUser, tunreadGroup, canToggleEncryption } = this.state;
		const {
			teamId,
			status,
			joined,
			omnichannelPermissions,
			theme,
			hasE2EEWarning,
			issuesWithNotifications,
			notificationsDisabled,
			toggleRoomE2EEncryptionPermission
		} = this.props;
		if (nextProps.teamId !== teamId) {
			return true;
		}
		if (nextProps.status !== status) {
			return true;
		}
		if (nextProps.joined !== joined) {
			return true;
		}
		if (nextProps.theme !== theme) {
			return true;
		}
		if (nextState.canToggleEncryption !== canToggleEncryption) {
			return true;
		}
		if (nextState.isFollowingThread !== isFollowingThread) {
			return true;
		}
		if (nextProps.issuesWithNotifications !== issuesWithNotifications) {
			return true;
		}
		if (nextProps.notificationsDisabled !== notificationsDisabled) {
			return true;
		}
		if (nextProps.hasE2EEWarning !== hasE2EEWarning) {
			return true;
		}
		if (!dequal(nextProps.omnichannelPermissions, omnichannelPermissions)) {
			return true;
		}
		if (!dequal(nextState.tunread, tunread)) {
			return true;
		}
		if (!dequal(nextState.tunreadUser, tunreadUser)) {
			return true;
		}
		if (!dequal(nextState.tunreadGroup, tunreadGroup)) {
			return true;
		}
		if (!dequal(nextProps.toggleRoomE2EEncryptionPermission, toggleRoomE2EEncryptionPermission)) {
			return true;
		}
		return false;
	}

	componentDidUpdate(prevProps: Readonly<IRightButtonsProps>): void {
		const { toggleRoomE2EEncryptionPermission } = this.props;
		if (!dequal(prevProps.toggleRoomE2EEncryptionPermission, toggleRoomE2EEncryptionPermission)) {
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
		this.setState({
			tunread: sub?.tunread ?? [],
			tunreadUser: sub?.tunreadUser ?? [],
			tunreadGroup: sub?.tunreadGroup ?? []
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
		const { rid } = this.props;
		if (rid) {
			showConfirmationAlert({
				message: i18n.t('Would_you_like_to_return_the_inquiry'),
				confirmationText: i18n.t('Yes'),
				onPress: async () => {
					try {
						await returnLivechat(rid);
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
				const result = await Services.getDepartmentInfo(departmentId);
				if (result.success) {
					departmentInfo = result.department as ILivechatDepartment;
				}
			}

			if (departmentInfo?.requestTagBeforeClosingChat) {
				tagsList = await Services.getTagsList();
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

	showMoreActions = () => {
		logEvent(events.ROOM_SHOW_MORE_ACTIONS);
		const { showActionSheet, rid, navigation, omnichannelPermissions, isMasterDetail } = this.props;

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

		showActionSheet({ options });
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

	onLayout = (l: any) => {
		const { onLayout } = this.props;
		onLayout(l);
	};

	render() {
		const { isFollowingThread, tunread, tunreadUser, tunreadGroup, canToggleEncryption } = this.state;
		const { t, tmid, threadsEnabled, rid, colors, issuesWithNotifications, notificationsDisabled, hasE2EEWarning } = this.props;

		if (!rid) {
			return null;
		}

		if (t === 'l') {
			if (!this.isOmnichannelPreview()) {
				return (
					<HeaderButton.Container onLayout={this.onLayout}>
						<HeaderButton.Item iconName='kebab' onPress={this.showMoreActions} testID='room-view-header-omnichannel-kebab' />
					</HeaderButton.Container>
				);
			}
			return null;
		}
		if (tmid) {
			return (
				<HeaderButton.Container onLayout={this.onLayout}>
					<HeaderButton.Item
						iconName={isFollowingThread ? 'notification' : 'notification-disabled'}
						onPress={this.toggleFollowThread}
						testID={isFollowingThread ? 'room-view-header-unfollow' : 'room-view-header-follow'}
					/>
				</HeaderButton.Container>
			);
		}
		return (
			<HeaderButton.Container onLayout={this.onLayout}>
				{hasE2EEWarning ? (
					<HeaderButton.Item
						iconName='encrypted'
						onPress={this.goE2EEToggleRoomView}
						disabled={!canToggleEncryption}
						testID='room-view-header-encryption'
					/>
				) : null}
				{issuesWithNotifications || notificationsDisabled ? (
					<HeaderButton.Item
						color={issuesWithNotifications ? colors!.fontDanger : ''}
						iconName='notification-disabled'
						onPress={this.navigateToNotificationOrPushTroubleshoot}
						testID='room-view-push-troubleshoot'
						disabled={hasE2EEWarning}
					/>
				) : null}
				{rid ? <HeaderCallButton rid={rid} disabled={hasE2EEWarning} /> : null}
				{threadsEnabled ? (
					<HeaderButton.Item
						iconName='threads'
						onPress={this.goThreadsView}
						testID='room-view-header-threads'
						badge={() => <HeaderButton.BadgeUnread tunread={tunread} tunreadUser={tunreadUser} tunreadGroup={tunreadGroup} />}
						disabled={hasE2EEWarning}
					/>
				) : null}
				<HeaderButton.Item iconName='search' onPress={this.goSearchView} testID='room-view-search' disabled={hasE2EEWarning} />
			</HeaderButton.Container>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	userId: getUserSelector(state).id,
	threadsEnabled: state.settings.Threads_enabled as boolean,
	isMasterDetail: state.app.isMasterDetail,
	livechatRequestComment: state.settings.Livechat_request_comment_when_closing_conversation as boolean,
	issuesWithNotifications: state.troubleshootingNotification.issuesWithNotifications,
	toggleRoomE2EEncryptionPermission: state.permissions['toggle-room-e2e-encryption']
});

export default connect(mapStateToProps)(withTheme(RightButtonsContainer));
