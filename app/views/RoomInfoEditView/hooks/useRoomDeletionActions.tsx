import { Q } from '@nozbe/watermelondb';
import { Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ChatsStackParamList } from '../../../stacks/types';
import { ModalStackParamList } from '../../../stacks/MasterDetailStack/types';
import { TNavigation } from '../../../stacks/stackType';
import database from '../../../lib/database';
import I18n from '../../../i18n';
import { getRoomTitle, showConfirmationAlert, showErrorAlert } from '../../../lib/methods/helpers';
import log from '../../../lib/methods/helpers/log';
import { deleteRoom as actionDeleteRoom } from '../../../actions/room';
import { ERoomType } from '../../../definitions/ERoomType';
import { ISubscription, TSubscriptionModel } from '../../../definitions';

interface IUseRoomDeletionActions {
	navigation: NativeStackNavigationProp<(ChatsStackParamList | ModalStackParamList) & TNavigation, 'RoomInfoEditView'>;
	room: ISubscription;
	deleteCPermission: boolean;
	deletePPermission: boolean;
}

const useRoomDeletionActions = ({ navigation, room, deleteCPermission, deletePPermission }: IUseRoomDeletionActions) => {
	const dispatch = useDispatch();

	const handleVerifyTeamChannelOwner = (teamChannels: TSubscriptionModel[]) => {
		const permissionChecks = teamChannels.map(channel => {
			const hasDeletePermission = channel.t === 'c' ? deleteCPermission : deletePPermission;
			if (hasDeletePermission) {
				return channel;
			}

			return false;
		});

		return permissionChecks.filter(Boolean)?.[0];
	};

	const deleteTeam = async () => {
		try {
			const db = database.active;
			const subCollection = db.get('subscriptions');
			const teamChannels = await subCollection
				.query(Q.where('team_id', room.teamId as string), Q.where('team_main', Q.notEq(true)))
				.fetch();

			const teamChannelOwner = handleVerifyTeamChannelOwner(teamChannels);

			if (teamChannelOwner) {
				navigation.navigate('SelectListView', {
					title: 'Delete_Team',
					data: teamChannelOwner,
					infoText: 'Select_channels_to_delete',
					nextAction: (selected: string[]) => {
						showConfirmationAlert({
							message: I18n.t('You_are_deleting_the_team', { team: getRoomTitle(room) }),
							confirmationText: I18n.t('Yes_action_it', { action: I18n.t('delete') }),
							onPress: () => actionDeleteRoom(ERoomType.t, room, selected)
						});
					}
				});
			} else {
				showConfirmationAlert({
					message: I18n.t('You_are_deleting_the_team', { team: getRoomTitle(room) }),
					confirmationText: I18n.t('Yes_action_it', { action: I18n.t('delete') }),
					onPress: () => dispatch(actionDeleteRoom(ERoomType.t, room))
				});
			}
		} catch (e: any) {
			log(e);
			showErrorAlert(
				e.data.error ? I18n.t(e.data.error) : I18n.t('There_was_an_error_while_action', { action: I18n.t('deleting_team') }),
				I18n.t('Cannot_delete')
			);
		}
	};

	const deleteRoom = () => {
		Alert.alert(
			I18n.t('Are_you_sure_question_mark'),
			I18n.t('Delete_Room_Warning'),
			[
				{
					text: I18n.t('Cancel'),
					style: 'cancel'
				},
				{
					text: I18n.t('Yes_action_it', { action: I18n.t('delete') }),
					style: 'destructive',
					onPress: () => dispatch(actionDeleteRoom(ERoomType.c, room))
				}
			],
			{ cancelable: false }
		);
	};

	return {
		deleteTeam,
		deleteRoom
	};
};

export default useRoomDeletionActions;
