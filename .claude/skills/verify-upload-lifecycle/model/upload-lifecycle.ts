type Send = 'first' | 'second' | 'third';
type Call = 'notSent' | 'preparing' | 'sending' | 'ended';
type UploadRecord = 'none' | 'uploading' | 'failed';

const sends: Send[] = ['first', 'second', 'third'];

let call: Record<Send, Call> = { first: 'notSent', second: 'notSent', third: 'notSent' };
let cancelled: Record<Send, boolean> = { first: false, second: false, third: false };
let queued: Send | null = null;
let record: UploadRecord = 'none';
let refusedWithNothingRunning = false;

const isPreparing = (send: Send) => call[send] === 'preparing';

const isRunning = (send: Send) => isPreparing(send) || (call[send] === 'sending' && !cancelled[send]);

const nothingRunning = () => !sends.some(isRunning);

const persistUploadError = () => {
	if (record !== 'none') {
		record = 'failed';
	}
};

const isUploadCancelled = (send: Send) => queued !== send;

const endUpload = (send: Send) => {
	if (queued === send) {
		queued = null;
	}
};

export const userSendsFile = (send: Send, force: boolean) => {
	if (call[send] !== 'notSent') return;
	if (force && record !== 'failed') return;
	if (record !== 'none' && queued !== null && !force) {
		if (nothingRunning()) {
			refusedWithNothingRunning = true;
		}
		call[send] = 'ended';
		return;
	}
	record = 'uploading';
	call[send] = 'preparing';
};

export const preparingFails = (send: Send) => {
	if (!isPreparing(send)) return;
	call[send] = 'ended';
	persistUploadError();
};

export const uploadStarts = (send: Send) => {
	if (!isPreparing(send)) return;
	queued = send;
	call[send] = 'sending';
};

export const serverAccepts = (send: Send) => {
	if (call[send] !== 'sending') return;
	if (cancelled[send]) return;
	record = 'none';
	endUpload(send);
	call[send] = 'ended';
};

export const serverRejects = (send: Send) => {
	if (call[send] !== 'sending') return;
	if (!isUploadCancelled(send)) {
		persistUploadError();
	}
	endUpload(send);
	call[send] = 'ended';
};

export const userCancels = () => {
	if (record !== 'uploading') return;
	if (queued !== null) {
		cancelled[queued] = true;
	}
	queued = null;
	record = 'none';
};

export const userDeletesFailedRow = () => {
	if (record !== 'failed') return;
	record = 'none';
};

export const roomOpens = () => {
	if (record === 'none' || queued !== null) return;
	record = 'failed';
};

export const appRestarts = () => {
	if (nothingRunning() && queued === null) return;
	call = {
		first: call.first === 'notSent' ? 'notSent' : 'ended',
		second: call.second === 'notSent' ? 'notSent' : 'ended',
		third: call.third === 'notSent' ? 'notSent' : 'ended'
	};
	queued = null;
};

/** Once an upload of a file ends (sent, rejected by the server, cancelled), sending the same file again in the same Room is never refused as "Upload in progress". */
export const neverRefusedAfterUploadEnded = () => !refusedWithNothingRunning;

/** @terminating */
export const everySendSettled = () => !sends.some(send => call[send] === 'preparing' || call[send] === 'sending');
