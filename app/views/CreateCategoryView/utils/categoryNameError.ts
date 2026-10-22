import I18n from '~/i18n';
import { CHATS_HEADER, OMNICHANNEL_HEADER_ON_HOLD } from '~/views/RoomsListView/utils/groupRooms';
import { SYSTEM_GROUPS } from '~/views/RoomsListView/utils/sidebarGroupOrder';

export const MAX_CATEGORY_NAME_LENGTH = 30;

const RESERVED_LABEL_KEYS = [...SYSTEM_GROUPS, CHATS_HEADER, OMNICHANNEL_HEADER_ON_HOLD];

const normalize = (name: string) => name.trim().toLowerCase();

export const getCategoryNameError = (name: string, existingNames: string[]): string | undefined => {
	const normalizedName = normalize(name);
	if (normalizedName.length > MAX_CATEGORY_NAME_LENGTH) {
		return I18n.t('Category_name_is_too_long', { maxLength: MAX_CATEGORY_NAME_LENGTH });
	}
	if (RESERVED_LABEL_KEYS.some(key => normalize(I18n.t(key)) === normalizedName)) {
		return I18n.t('Category_name_conflicts_with_system_group');
	}
	if (existingNames.some(existingName => normalize(existingName) === normalizedName)) {
		return I18n.t('A_category_with_this_name_already_exists');
	}
};
