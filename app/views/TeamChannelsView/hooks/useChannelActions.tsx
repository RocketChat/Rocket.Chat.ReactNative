import { Alert } from 'react-native';
import { shallowEqual, useDispatch } from 'react-redux';

import { deleteRoom } from '~/actions/room';
import { type TActionSheetOptionsItem, useActionSheet } from '~/containers/ActionSheet';
import { CustomIcon } from '~/containers/CustomIcon';
import { type TSubscriptionModel } from '~/definitions';
import { ERoomType } from '~/definitions/ERoomType';
import I18n from '~/i18n';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { usePermissions } from '~/lib/hooks/usePermissions';
import { hasPermission } from '~/lib/methods/helpers';
import log, { events, logEvent } from '~/lib/methods/helpers/log';
import { removeTeamRoom, updateTeamRoom } from '~/lib/services/restApi';
import { useTheme } from '~/theme';
import { type TTeamChannel } from '../types';

interface IUseChannelActions {
	team: TSubscriptionModel | null;
	updateItem: (id: string, patch: Partial<TTeamChannel>) => void;
	removeItem: (id: string) => void;
}

export const useChannelActions = ({ team, updateItem, removeItem }: IUseChannelActions) => {
	const { colors } = useTheme();
	const { showActionSheet } = useActionSheet();
	const dispatch = useDispatch();
	const [canAutoJoin, canRemove] = usePermissions(['edit-team-channel', 'remove-team-channel'], team?.rid);
	const deleteRoles = useAppSelector(
		state => ({ c: state.permissions['delete-c'], p: state.permissions['delete-p'] }),
		shallowEqual
	);

	const toggleAutoJoin = async (item: TTeamChannel) => {
		logEvent(events.TC_TOGGLE_AUTOJOIN);
		try {
			const result = await updateTeamRoom({ roomId: item._id, isDefault: !item.teamDefault });
			if (result.success) {
				updateItem(item._id, { teamDefault: !item.teamDefault });
			}
		} catch (e) {
			logEvent(events.TC_TOGGLE_AUTOJOIN_F);
			log(e);
		}
	};

	const removeRoom = async (item: TTeamChannel, teamId: string) => {
		logEvent(events.TC_DELETE_ROOM);
		try {
			const result = await removeTeamRoom({ roomId: item._id, teamId });
			if (result.success) {
				removeItem(result.room._id);
			}
		} catch (e) {
			logEvent(events.TC_DELETE_ROOM_F);
			log(e);
		}
	};

	const confirmRemove = (item: TTeamChannel, teamId: string) => {
		Alert.alert(
			I18n.t('Confirmation'),
			I18n.t('Remove_Team_Room_Warning'),
			[
				{ text: I18n.t('Cancel'), style: 'cancel' },
				{
					text: I18n.t('Yes_action_it', { action: I18n.t('remove') }),
					style: 'destructive',
					onPress: () => removeRoom(item, teamId)
				}
			],
			{ cancelable: false }
		);
	};

	const confirmDelete = (item: TTeamChannel) => {
		logEvent(events.TC_DELETE_ROOM);
		Alert.alert(
			I18n.t('Are_you_sure_question_mark'),
			I18n.t('Delete_Room_Warning'),
			[
				{ text: I18n.t('Cancel'), style: 'cancel' },
				{
					text: I18n.t('Yes_action_it', { action: I18n.t('delete') }),
					style: 'destructive',
					onPress: () => dispatch(deleteRoom(ERoomType.c, item))
				}
			],
			{ cancelable: false }
		);
	};

	const showChannelActions = async (item: TTeamChannel) => {
		logEvent(events.ROOM_SHOW_BOX_ACTIONS);
		if (!team) {
			return;
		}
		const [canDelete] = await hasPermission([item.t === 'c' ? deleteRoles.c : deleteRoles.p], item._id);
		const isAutoJoinChecked = item.teamDefault;
		const options: TActionSheetOptionsItem[] = [];

		if (canAutoJoin) {
			options.push({
				title: I18n.t('Auto-join'),
				icon: item.t === 'p' ? 'channel-private' : 'channel-public',
				onPress: () => toggleAutoJoin(item),
				right: () => (
					<CustomIcon
						testID={isAutoJoinChecked ? 'auto-join-checked' : 'auto-join-unchecked'}
						name={isAutoJoinChecked ? 'checkbox-checked' : 'checkbox-unchecked'}
						size={20}
						color={isAutoJoinChecked ? colors.fontHint : colors.fontDefault}
					/>
				),
				testID: 'action-sheet-auto-join'
			});
		}

		if (canRemove) {
			options.push({
				title: I18n.t('Remove_from_Team'),
				icon: 'close',
				danger: true,
				onPress: () => confirmRemove(item, team.teamId as string),
				testID: 'action-sheet-remove-from-team'
			});
		}

		if (canDelete) {
			options.push({
				title: I18n.t('Delete'),
				icon: 'delete',
				danger: true,
				onPress: () => confirmDelete(item),
				testID: 'action-sheet-delete'
			});
		}

		if (options.length) {
			showActionSheet({ options });
		}
	};

	return showChannelActions;
};
