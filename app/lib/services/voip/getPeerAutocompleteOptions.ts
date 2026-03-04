import type { TUserStatus } from '../../../definitions';
import { usersAutoComplete } from '../restApi';
import { store as reduxStore } from '../../store/auxStore';

export type TPeerItem =
	| { type: 'user'; value: string; label: string; username?: string; callerId?: string; status?: TUserStatus }
	| { type: 'sip'; value: string; label: string };

export type TPeerInfo =
	| { userId: string; displayName: string; username?: string; callerId?: string; status?: TUserStatus }
	| { number: string };

type TUserAutocompleteResponse = {
	success?: boolean;
	items?: Array<{
		_id: string;
		name?: string;
		username?: string;
		freeSwitchExtension?: string;
		status?: TUserStatus;
	}>;
};

const getExtensionFromPeerInfo = (peerInfo?: TPeerInfo | null): string | undefined => {
	if (!peerInfo) {
		return undefined;
	}

	if ('callerId' in peerInfo) {
		return peerInfo.callerId;
	}

	if ('number' in peerInfo) {
		return peerInfo.number;
	}

	return undefined;
};

const getPeerUsername = (peerInfo?: TPeerInfo | null): string | undefined => {
	if (!peerInfo || !('username' in peerInfo)) {
		return undefined;
	}

	return peerInfo.username;
};

// TODO: hook?
export const getPeerAutocompleteOptions = async ({
	filter,
	peerInfo
}: {
	filter: string;
	peerInfo?: TPeerInfo | null;
}): Promise<TPeerItem[]> => {
	const term = filter.trim();
	if (!term) {
		return [];
	}

	const currentUsername = reduxStore.getState().login.user.username as string | undefined;
	const peerUsername = getPeerUsername(peerInfo);
	const peerExtension = getExtensionFromPeerInfo(peerInfo);
	const forceSIPRouting = Boolean(reduxStore.getState().settings.VoIP_TeamCollab_SIP_Integration_For_Internal_Calls);

	const conditions =
		peerExtension || forceSIPRouting
			? {
					$and: [
						forceSIPRouting ? { freeSwitchExtension: { $exists: true } } : null,
						peerExtension ? { freeSwitchExtension: { $ne: peerExtension } } : null
					].filter(Boolean)
			  }
			: undefined;

	const exceptions = [currentUsername, peerUsername].filter(Boolean);
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
					callerId: item.freeSwitchExtension,
					status: item.status
				}))
		: [];

	const sipOption: TPeerItem = {
		type: 'sip',
		value: term,
		label: term
	};

	return [sipOption, ...userOptions];
};
