import i18n from '../../../../i18n';

export const getTranslations = ({
	shouldChangeOwner,
	shouldBeRemoved
}: {
	shouldChangeOwner: string[];
	shouldBeRemoved: string[];
}): { changeOwnerRooms: string; removedRooms: string } => {
	let changeOwnerRooms = '';
	if (shouldChangeOwner.length) {
		if (shouldChangeOwner.length === 1) {
			changeOwnerRooms = i18n.t('A_new_owner_will_be_assigned_automatically_to__count__room', {
				count: shouldChangeOwner.length
			});
		} else {
			changeOwnerRooms = i18n.t('A_new_owner_will_be_assigned_automatically_to__count__rooms', {
				count: shouldChangeOwner.length
			});
		}
	}

	let removedRooms = '';
	if (shouldBeRemoved.length) {
		if (shouldBeRemoved.length === 1) {
			removedRooms = i18n.t('__count__empty_room_will_be_removed_automatically', {
				count: shouldBeRemoved.length
			});
		} else {
			removedRooms = i18n.t('__count__empty_rooms_will_be_removed_automatically', {
				count: shouldBeRemoved.length
			});
		}
	}
	return { changeOwnerRooms, removedRooms };
};
