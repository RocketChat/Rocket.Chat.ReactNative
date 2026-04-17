import { usersAutoComplete } from '../restApi';

export type TPeerItem =
	| { type: 'user'; value: string; label: string; username?: string; callerId?: string }
	| { type: 'sip'; value: string; label: string };

type TUserAutocompleteResponse = {
	success?: boolean;
	items?: Array<{
		_id: string;
		name?: string;
		username?: string;
		freeSwitchExtension?: string;
	}>;
};

export type TPeerAutocompleteAuth = {
	username?: string;
	sipEnabled: boolean;
};

export const getPeerAutocompleteOptions = async ({
	filter,
	peerInfo,
	username,
	sipEnabled
}: {
	filter: string;
	peerInfo?: TPeerItem | null;
} & TPeerAutocompleteAuth): Promise<TPeerItem[]> => {
	const term = filter.trim();
	if (!term) {
		return [];
	}

	const peerUsername = peerInfo && 'username' in peerInfo ? peerInfo.username : undefined;
	const peerExtension = peerInfo && 'callerId' in peerInfo ? peerInfo.callerId : undefined;

	const conditions =
		peerExtension || sipEnabled
			? {
					$and: [
						sipEnabled ? { freeSwitchExtension: { $exists: true } } : null,
						peerExtension ? { freeSwitchExtension: { $ne: peerExtension } } : null
					].filter(Boolean)
			  }
			: undefined;

	const exceptions = [username, peerUsername].filter(Boolean);
	const selector = {
		term,
		exceptions,
		...(conditions && { conditions })
	};

	const response = (await usersAutoComplete(selector)) as TUserAutocompleteResponse;
	const canUseItems = response?.success ?? true;

	const userOptions: TPeerItem[] = canUseItems
		? (response?.items || [])
				.filter(item => !!item?._id && !!(item.name || item.username))
				.map(item => ({
					type: 'user',
					value: item._id,
					label: item.name || item.username || '',
					username: item.username,
					callerId: item.freeSwitchExtension
				}))
		: [];

	const sipOption: TPeerItem = {
		type: 'sip',
		value: term,
		label: term
	};

	return [sipOption, ...userOptions];
};
