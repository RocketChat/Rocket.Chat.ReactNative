import { usersAutoComplete } from '../restApi';
import { compareServerVersion } from '~/lib/methods/helpers';
import { store as reduxStore } from '~/lib/store/auxStore';

export type TPeerItem =
	| { type: 'user'; value: string; label: string; username?: string; callerId?: string }
	| { type: 'sip'; value: string; label: string };

type TUserAutocompleteResponse = {
	success?: boolean;
	error?: string | null;
	items?: Array<{
		_id: string;
		name?: string;
		username?: string;
		freeSwitchExtension?: string;
		sipExtension?: string;
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

	const peerUsername = peerInfo?.type === 'user' ? peerInfo.username : undefined;
	const peerExtension = peerInfo?.type === 'user' ? peerInfo.callerId : undefined;

	const serverVersion = reduxStore?.getState()?.server?.version;
	const extensionField = compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '9.0.0')
		? 'sipExtension'
		: 'freeSwitchExtension';

	const conditions =
		peerExtension || sipEnabled
			? {
					$and: [
						sipEnabled ? { [extensionField]: { $exists: true } } : null,
						peerExtension ? { [extensionField]: { $ne: peerExtension } } : null
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

	const loggedInUserId = reduxStore?.getState()?.login?.user?.id;

	const userOptions: TPeerItem[] = canUseItems
		? (response?.items || [])
				.filter(item => !!item?._id && !!(item.name || item.username) && item._id !== loggedInUserId)
				.map(item => ({
					type: 'user',
					value: item._id,
					label: item.name || item.username || '',
					username: item.username,
					callerId: item[extensionField]
				}))
		: [];

	const sipOption: TPeerItem = {
		type: 'sip',
		value: term,
		label: term
	};

	return [sipOption, ...userOptions];
};
