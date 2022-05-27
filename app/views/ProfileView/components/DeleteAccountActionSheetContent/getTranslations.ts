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
			changeOwnerRooms = i18n.t('A_new_owner_will_be_assigned_automatically_to_the__roomName__room', {
				roomName: shouldChangeOwner.pop()
			});
		} else {
			changeOwnerRooms = i18n.t('A_new_owner_will_be_assigned_automatically_to_those__count__rooms__rooms__', {
				count: shouldChangeOwner.length,
				rooms: shouldBeRemoved.join(', ')
			});
		}
	}

	let removedRooms = '';
	if (shouldBeRemoved.length) {
		if (shouldBeRemoved.length === 1) {
			removedRooms = i18n.t('The_empty_room__roomName__will_be_removed_automatically', {
				roomName: shouldBeRemoved.pop()
			});
		} else if (shouldBeRemoved.length <= 5) {
			removedRooms = i18n.t('__count__empty_rooms_will_be_removed_automatically__rooms__', {
				count: shouldBeRemoved.length,
				rooms: shouldBeRemoved.join(', ')
			});
		} else {
			removedRooms = i18n.t('__count__empty_rooms_will_be_removed_automatically', {
				count: shouldBeRemoved.length
			});
		}
	}
	return { changeOwnerRooms, removedRooms };
};
