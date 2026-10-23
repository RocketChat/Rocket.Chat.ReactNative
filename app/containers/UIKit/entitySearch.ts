import { roomsAutoComplete, usersAutoComplete } from '~/lib/services/restApi';
import { type IItemData } from './MultiSelect';

type TUserAutocompleteResponse = {
	success?: boolean;
	items?: Array<{
		_id: string;
		name?: string;
		username?: string;
	}>;
};

type TRoomsAutocompleteResponse = {
	success?: boolean;
	items?: Array<{
		_id: string;
		name?: string;
		fname?: string;
	}>;
};

export const searchUsers = async (keyword: string): Promise<IItemData[]> => {
	try {
		const term = keyword.trim();
		const response = (await usersAutoComplete({ term })) as TUserAutocompleteResponse;
		if (response?.success === false) {
			return [];
		}
		return (response?.items || [])
			.filter(item => !!(item.username || item.name))
			.map(item => ({
				value: item.username || item.name || '',
				text: { text: item.name || item.username || '' }
			}));
	} catch {
		return [];
	}
};

export const searchChannels = async (keyword: string): Promise<IItemData[]> => {
	try {
		const term = keyword.trim();
		const response = (await roomsAutoComplete({ name: term })) as TRoomsAutocompleteResponse;
		if (response?.success === false) {
			return [];
		}
		return (response?.items || [])
			.filter(item => !!item._id && !!(item.fname || item.name))
			.map(item => ({
				value: item._id,
				text: { text: item.fname || item.name || '' }
			}));
	} catch {
		return [];
	}
};
