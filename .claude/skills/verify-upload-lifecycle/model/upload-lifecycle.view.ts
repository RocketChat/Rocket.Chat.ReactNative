type Vars = {
	api: string;
	queued: boolean;
	record: string;
	attempt: string;
	refusedWithNothingInFlight: boolean;
};

export const title = 'Sending a file in a Room';

const rowLabel = (record: string) =>
	record === 'none' ? 'no upload row' : record === 'failed' ? 'failed upload row' : 'upload row in progress';

export const state = (v: Vars) => {
	if (v.refusedWithNothingInFlight) {
		return 'Refused: Upload in progress';
	}
	if (v.attempt !== 'none') {
		const phase = v.attempt === 'preparing' ? 'Preparing the file' : 'Uploading';
		return v.record === 'failed' ? `${phase}, shown as failed` : phase;
	}
	return `Idle, ${rowLabel(v.record)}${v.queued ? ', stale queue entry' : ''}`;
};

const labels: Record<string, string> = {
	userSendsFile: 'you send the file',
	preparingFails: 'preparing the file fails',
	uploadStarts: 'the upload starts',
	serverAccepts: 'the server accepts it',
	serverRejects: 'the server rejects it',
	userCancels: 'you cancel the upload',
	appRestarts: 'the app restarts'
};

export const step = (action: string, from: Vars, to: Vars) => {
	if (action === 'userSendsFile' && from.attempt !== 'none') {
		return 'you tap Send again [while it uploads]';
	}
	if (action === 'userSendsFile' && from.record === 'failed' && !to.refusedWithNothingInFlight && to.attempt === 'preparing') {
		return 'you send the file or tap retry';
	}
	return labels[action] ?? action;
};
