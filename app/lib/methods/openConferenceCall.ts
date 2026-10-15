import {
	beginConferenceCallOpen,
	currentConferenceCallOpen,
	expandConferenceCall
} from '../services/conference/conferenceCallNavigation';
import { conferenceSession } from '../services/conference/ConferenceSession';
import {
	isConferenceSessionActive,
	preflightCallId,
	useConferenceCallStore
} from '../services/conference/useConferenceCallStore';
import { store } from '../store/auxStore';
import log from './helpers/log';
import { requestVoipCallPermissions } from './voipCallPermissions';

type TConferenceTarget = { callId: string; rid?: string } | { rid: string };

const targetId = (target: TConferenceTarget): string => ('callId' in target ? target.callId : preflightCallId(target.rid));

const requestCallPermissions = async (): Promise<void> => {
	try {
		await requestVoipCallPermissions();
	} catch (e) {
		log(e);
	}
};

export const openConferenceCall = async (target: TConferenceTarget): Promise<void> => {
	const { server } = store.getState().server;

	if (!server) {
		throw new Error('Cannot open a conference call without a Workspace');
	}

	const request = beginConferenceCallOpen();

	await requestCallPermissions();

	if (request !== currentConferenceCallOpen()) {
		return;
	}
	if (store.getState().server.server !== server) {
		return;
	}

	const callId = targetId(target);
	const showing = useConferenceCallStore.getState();
	if (showing.callId && showing.callId !== callId && isConferenceSessionActive(showing.phase)) {
		await conferenceSession.end();
		if (request !== currentConferenceCallOpen()) {
			return;
		}
	}

	useConferenceCallStore.getState().open({ callId, rid: target.rid, server });
	expandConferenceCall();
};
