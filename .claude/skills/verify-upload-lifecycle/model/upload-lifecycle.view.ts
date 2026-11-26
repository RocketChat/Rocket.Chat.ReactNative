type Call = 'notSent' | 'preparing' | 'sending' | 'ended';

type Vars = {
	call: Record<string, Call>;
	cancelled: Record<string, boolean>;
	queued: string;
	record: string;
	refusedWithNothingRunning: boolean;
};

export const title = 'Sending the same file in a Room';

const rowLabel = (record: string) =>
	record === 'none' ? 'no upload row' : record === 'failed' ? 'failed upload row' : 'upload row in progress';

const calls = (v: Vars) => Object.keys(v.call).map(send => ({ phase: v.call[send], cancelled: v.cancelled[send] }));

export const state = (v: Vars) => {
	if (v.refusedWithNothingRunning) {
		return 'Refused: Upload in progress';
	}
	const running = calls(v).filter(c => c.phase === 'preparing' || (c.phase === 'sending' && !c.cancelled));
	const cancelledStillSettling = calls(v).some(c => c.phase === 'sending' && c.cancelled);
	const settling = cancelledStillSettling ? ', a cancelled upload still settling' : '';
	if (running.length > 0) {
		const phase = running.some(c => c.phase === 'preparing') ? 'Preparing the file' : 'Uploading';
		return v.record === 'failed' ? `${phase}, shown as failed${settling}` : `${phase}${settling}`;
	}
	const stale = v.queued !== 'Null' && !cancelledStillSettling ? ', stale queue entry' : '';
	return `Idle, ${rowLabel(v.record)}${stale}${settling}`;
};

const labels: Record<string, string> = {
	userSendsFile: 'you send the file',
	preparingFails: 'preparing the file fails',
	uploadStarts: 'the upload starts',
	serverAccepts: 'the server accepts it',
	serverRejects: 'the server rejects it',
	userCancels: 'you cancel the upload',
	userDeletesFailedRow: 'you dismiss the failed row',
	roomOpens: 'you open the Room',
	appRestarts: 'the app restarts'
};

const actionName = (action: string) => action.split('(')[0];

const changedSend = (from: Vars, to: Vars) => Object.keys(from.call).find(send => from.call[send] !== to.call[send]) ?? '';

export const step = (action: string, from: Vars, to: Vars) => {
	const name = actionName(action);
	const send = changedSend(from, to);
	if (name === 'userSendsFile' && to.call[send] === 'ended') {
		return 'you send the file [refused]';
	}
	if (name === 'userSendsFile' && from.record === 'failed') {
		return 'you send the file or tap retry';
	}
	if (name === 'serverRejects' && from.cancelled[send]) {
		return 'the cancelled upload settles';
	}
	return labels[name] ?? name;
};
