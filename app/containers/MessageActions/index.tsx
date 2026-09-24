import { forwardRef, useImperativeHandle, memo, type ReactNode } from 'react';
import { connect } from 'react-redux';

import I18n from '~/i18n';
import { logEvent } from '~/lib/methods/helpers/log';
import { type TActionSheetOptionsItem, useActionSheet, ACTION_SHEET_ANIMATION_DURATION } from '../ActionSheet';
import { useLastFocusedMessageRef } from '~/lib/a11y/useLastFocusedMessageRef';
import Header, { HEADER_HEIGHT, type IHeader } from './Header';
import events from '~/lib/methods/helpers/log/events';
import {
	type IApplicationState,
	type IEmoji,
	type ILoggedUser,
	type TAnyMessageModel,
	type TSubscriptionModel
} from '~/definitions';
import { withMasterDetail } from '~/lib/hooks/useMasterDetail';
import { useMessageActionOptions, useMessageActionPermissions } from './useMessageActionOptions';
import { MessageActionsMenuContext } from './MessageActionsMenuContext';

// Extra delay on top of the action sheet animation so accessibility focus is restored
// only after the sheet is fully dismissed.
const REFOCUS_BUFFER = 50;

export interface IMessageActionsProps {
	getRoom: () => TSubscriptionModel;
	tmid?: string;
	user: Pick<ILoggedUser, 'id'>;
	editInit: (messageId: string) => void;
	reactionInit: (messageId: string) => void;
	onReactionPress: (shortname: IEmoji, messageId: string) => void;
	replyInit: (messageId: string) => void;
	quoteInit: (messageId: string) => void;
	jumpToMessage?: (messageUrl?: string, isFromReply?: boolean) => Promise<void>;
	isMasterDetail: boolean;
	isReadOnly: boolean;
	serverVersion?: string | null;
	Message_AllowDeleting?: boolean;
	Message_AllowDeleting_BlockDeleteInMinutes?: number;
	Message_AllowEditing?: boolean;
	Message_AllowEditing_BlockEditInMinutes?: number;
	Message_AllowPinning?: boolean;
	Message_AllowStarring?: boolean;
	Message_Read_Receipt_Store_Users?: boolean;
	editMessagePermission?: string[];
	deleteMessagePermission?: string[];
	forceDeleteMessagePermission?: string[];
	deleteOwnMessagePermission?: string[];
	pinMessagePermission?: string[];
	createDirectMessagePermission?: string[];
	createDiscussionOtherUserPermission?: string[];
	children?: ReactNode;
}

export interface IMessageActions {
	showMessageActions: (message: TAnyMessageModel) => Promise<void>;
}
const MessageActions = memo(
	forwardRef<IMessageActions, IMessageActionsProps>(
		(
			{
				getRoom,
				tmid,
				user,
				editInit,
				reactionInit,
				onReactionPress,
				replyInit,
				quoteInit,
				jumpToMessage,
				isReadOnly,
				Message_AllowDeleting,
				Message_AllowDeleting_BlockDeleteInMinutes,
				Message_AllowEditing,
				Message_AllowEditing_BlockEditInMinutes,
				Message_AllowPinning,
				Message_AllowStarring,
				Message_Read_Receipt_Store_Users,
				isMasterDetail,
				editMessagePermission,
				deleteMessagePermission,
				forceDeleteMessagePermission,
				deleteOwnMessagePermission,
				pinMessagePermission,
				createDirectMessagePermission,
				createDiscussionOtherUserPermission,
				serverVersion,
				children
			},
			ref
		) => {
			const { showActionSheet, hideActionSheet } = useActionSheet();
			const { restoreFocusOnClose } = useLastFocusedMessageRef();
			const { getPermissions, getOptions, permissionList } = useMessageActionOptions({
				getRoom,
				tmid,
				user,
				editInit,
				replyInit,
				quoteInit,
				jumpToMessage,
				isReadOnly,
				Message_AllowDeleting,
				Message_AllowDeleting_BlockDeleteInMinutes,
				Message_AllowEditing,
				Message_AllowEditing_BlockEditInMinutes,
				Message_AllowPinning,
				Message_AllowStarring,
				Message_Read_Receipt_Store_Users,
				isMasterDetail,
				editMessagePermission,
				deleteMessagePermission,
				forceDeleteMessagePermission,
				deleteOwnMessagePermission,
				pinMessagePermission,
				createDirectMessagePermission,
				createDiscussionOtherUserPermission,
				serverVersion
			});

			const menuPermissions = useMessageActionPermissions(permissionList, getRoom().rid);

			const canReact = () => !isReadOnly || !!getRoom().reactWhenReadOnly;

			const handleReaction: IHeader['handleReaction'] = (emoji, message) => {
				logEvent(events.ROOM_MSG_ACTION_REACTION);
				if (emoji) {
					onReactionPress(emoji, message.id);
				} else {
					setTimeout(() => reactionInit(message.id), ACTION_SHEET_ANIMATION_DURATION);
				}
				hideActionSheet();
			};

			const getMenuOptions = (message: TAnyMessageModel): TActionSheetOptionsItem[] => {
				const options = getOptions(message, menuPermissions);
				if (!canReact()) {
					return options;
				}
				const reactionOption: TActionSheetOptionsItem = {
					title: I18n.t('Add_reaction'),
					icon: 'reaction-add',
					onPress: () => {
						logEvent(events.ROOM_MSG_ACTION_REACTION);
						setTimeout(() => reactionInit(message.id), ACTION_SHEET_ANIMATION_DURATION);
					},
					testID: 'message-actions-add-reaction'
				};
				return [reactionOption, ...options];
			};

			const showMessageActions = async (message: TAnyMessageModel) => {
				logEvent(events.ROOM_SHOW_MSG_ACTIONS);
				const permissions = await getPermissions();
				// Buffer so focus lands after the action sheet is fully dismissed, not mid-animation.
				const onClose = restoreFocusOnClose(ACTION_SHEET_ANIMATION_DURATION + REFOCUS_BUFFER);
				showActionSheet({
					options: getOptions(message, permissions),
					headerHeight: HEADER_HEIGHT,
					customHeader: (
						<>
							{canReact() ? <Header handleReaction={handleReaction} isMasterDetail={isMasterDetail} message={message} /> : null}
						</>
					),
					onClose
				});
			};

			useImperativeHandle(ref, () => ({ showMessageActions }));

			return <MessageActionsMenuContext.Provider value={{ getMenuOptions }}>{children}</MessageActionsMenuContext.Provider>;
		}
	)
);
const mapStateToProps = (state: IApplicationState) => ({
	server: state.server.server,
	serverVersion: state.server.version,
	Message_AllowDeleting: state.settings.Message_AllowDeleting as boolean,
	Message_AllowDeleting_BlockDeleteInMinutes: state.settings.Message_AllowDeleting_BlockDeleteInMinutes as number,
	Message_AllowEditing: state.settings.Message_AllowEditing as boolean,
	Message_AllowEditing_BlockEditInMinutes: state.settings.Message_AllowEditing_BlockEditInMinutes as number,
	Message_AllowPinning: state.settings.Message_AllowPinning as boolean,
	Message_AllowStarring: state.settings.Message_AllowStarring as boolean,
	Message_Read_Receipt_Store_Users: state.settings.Message_Read_Receipt_Store_Users as boolean,
	editMessagePermission: state.permissions['edit-message'],
	deleteMessagePermission: state.permissions['delete-message'],
	deleteOwnMessagePermission: state.permissions['delete-own-message'],
	forceDeleteMessagePermission: state.permissions['force-delete-message'],
	pinMessagePermission: state.permissions['pin-message'],
	createDirectMessagePermission: state.permissions['create-d'],
	createDiscussionOtherUserPermission: state.permissions['start-discussion-other-user']
});

export default connect(mapStateToProps, null, null, { forwardRef: true })(withMasterDetail(MessageActions));
