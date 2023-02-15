import React, { Component } from 'react';
import { connect } from 'react-redux';
import { dequal } from 'dequal';
import { Observable, Subscription } from 'rxjs';
import { Dispatch } from 'redux';
import { StackNavigationProp } from '@react-navigation/stack';

import { ILivechatTag } from '../../definitions/ILivechatTag';
import * as HeaderButton from '../../containers/HeaderButton';
import database from '../../lib/database';
import { getUserSelector } from '../../selectors/login';
import { events, logEvent } from '../../lib/methods/helpers/log';
import { isTeamRoom } from '../../lib/methods/helpers/room';
import { IApplicationState, SubscriptionType, TMessageModel, TSubscriptionModel } from '../../definitions';
import { ChatsStackParamList } from '../../stacks/types';
import { TActionSheetOptionsItem } from '../../containers/ActionSheet';
import i18n from '../../i18n';
import { showConfirmationAlert, showErrorAlert } from '../../lib/methods/helpers';
import { onHoldLivechat, returnLivechat } from '../../lib/services/restApi';
import { closeLivechat as closeLivechatService } from '../../lib/methods/helpers/closeLivechat';
import { Services } from '../../lib/services';
import { ILivechatDepartment } from '../../definitions/ILivechatDepartment';

interface IRightButtonsProps {
	userId?: string;
	threadsEnabled: boolean;
	rid?: string;
	t: string;
	tmid?: string;
	teamId?: string;
	isMasterDetail: boolean;
	toggleFollowThread: Function;
	joined: boolean;
	status?: string;
	dispatch: Dispatch;
	encrypted?: boolean;
	navigation: StackNavigationProp<ChatsStackParamList, 'RoomView'>;
	omnichannelPermissions: {
		canForwardGuest: boolean;
		canReturnQueue: boolean;
		canPlaceLivechatOnHold: boolean;
	};
	livechatRequestComment: boolean;
	showActionSheet: Function;
	departmentId?: string;
}

interface IRigthButtonsState {
	isFollowingThread: boolean;
	tunread: string[];
	tunreadUser: string[];
	tunreadGroup: string[];
}

class RightButtonsContainer extends Component<IRightButtonsProps, IRigthButtonsState> {
	private threadSubscription?: Subscription;
	private subSubscription?: Subscription;

	constructor(props: IRightButtonsProps) {
		super(props);
		this.state = {
			isFollowingThread: true,
			tunread: [],
			tunreadUser: [],
			tunreadGroup: []
		};
	}

	async componentDidMount() {
		const { tmid, rid } = this.props;
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
				const subRecord = await subCollection.find(rid);
				this.observeSubscription(subRecord);
			} catch (e) {
				console.log("Can't find subscription to observe.");
			}
		}
	}

	shouldComponentUpdate(nextProps: IRightButtonsProps, nextState: IRigthButtonsState) {
		const { isFollowingThread, tunread, tunreadUser, tunreadGroup } = this.state;
		const { teamId, status, joined, omnichannelPermissions } = this.props;
		if (nextProps.teamId !== teamId) {
			return true;
		}
		if (nextProps.status !== status) {
			return true;
		}
		if (nextProps.joined !== joined) {
			return true;
		}
		if (nextState.isFollowingThread !== isFollowingThread) {
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
		return false;
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
		});
	};

	updateSubscription = (sub: TSubscriptionModel) => {
		this.setState({
			tunread: sub?.tunread ?? [],
			tunreadUser: sub?.tunreadUser ?? [],
			tunreadGroup: sub?.tunreadGroup ?? []
		});
	};

	goTeamChannels = () => {
		logEvent(events.ROOM_GO_TEAM_CHANNELS);
		const { navigation, isMasterDetail, teamId, joined } = this.props;
		if (!teamId) {
			return;
		}
		if (isMasterDetail) {
			// @ts-ignore TODO: find a way to make this work
			navigation.navigate('ModalStackNavigator', {
				screen: 'TeamChannelsView',
				params: { teamId, joined }
			});
		} else {
			navigation.navigate('TeamChannelsView', { teamId, joined });
		}
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

	render() {
		const { isFollowingThread, tunread, tunreadUser, tunreadGroup } = this.state;
		const { t, tmid, threadsEnabled, teamId, joined } = this.props;

		if (t === 'l') {
			if (!this.isOmnichannelPreview()) {
				return (
					<HeaderButton.Container>
						<HeaderButton.Item iconName='kebab' onPress={this.showMoreActions} testID='room-view-header-omnichannel-kebab' />
					</HeaderButton.Container>
				);
			}
			return null;
		}
		if (tmid) {
			return (
				<HeaderButton.Container>
					<HeaderButton.Item
						iconName={isFollowingThread ? 'notification' : 'notification-disabled'}
						onPress={this.toggleFollowThread}
						testID={isFollowingThread ? 'room-view-header-unfollow' : 'room-view-header-follow'}
					/>
				</HeaderButton.Container>
			);
		}
		return (
			<HeaderButton.Container>
				{isTeamRoom({ teamId, joined }) ? (
					<HeaderButton.Item iconName='channel-public' onPress={this.goTeamChannels} testID='room-view-header-team-channels' />
				) : null}
				{threadsEnabled ? (
					<HeaderButton.Item
						iconName='threads'
						onPress={this.goThreadsView}
						testID='room-view-header-threads'
						badge={() => <HeaderButton.BadgeUnread tunread={tunread} tunreadUser={tunreadUser} tunreadGroup={tunreadGroup} />}
					/>
				) : null}
				<HeaderButton.Item iconName='search' onPress={this.goSearchView} testID='room-view-search' />
			</HeaderButton.Container>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	userId: getUserSelector(state).id,
	threadsEnabled: state.settings.Threads_enabled as boolean,
	isMasterDetail: state.app.isMasterDetail,
	livechatRequestComment: state.settings.Livechat_request_comment_when_closing_conversation as boolean
});

export default connect(mapStateToProps)(RightButtonsContainer);
