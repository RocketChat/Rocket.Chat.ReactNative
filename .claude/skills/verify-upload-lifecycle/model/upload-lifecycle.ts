type Api = 'v1' | 'v2';
type UploadRecord = 'none' | 'uploading' | 'failed';
type Attempt = 'none' | 'preparing' | 'sending';

let api!: Api;
let queued = false;
let record: UploadRecord = 'none';
let attempt: Attempt = 'none';
let refusedWithNothingInFlight = false;

const persistUploadError = () => {
	if (record !== 'none') {
		record = 'failed';
	}
};

const isRefused = (force: boolean) => record !== 'none' && queued && !force;

const refuse = () => {
	if (attempt === 'none') {
		refusedWithNothingInFlight = true;
	}
	if (api === 'v2') {
		persistUploadError();
	}
};

export const userSendsFile = (force: boolean) => {
	if (force && (record !== 'failed' || attempt !== 'none')) return;
	if (isRefused(force)) {
		refuse();
		return;
	}
	if (attempt !== 'none') return;
	record = 'uploading';
	attempt = 'preparing';
};

export const preparingFails = () => {
	if (attempt !== 'preparing') return;
	attempt = 'none';
	if (api === 'v1' && !queued) {
		return;
	}
	persistUploadError();
};

export const uploadStarts = () => {
	if (attempt !== 'preparing') return;
	queued = true;
	attempt = 'sending';
};

export const serverAccepts = () => {
	if (attempt !== 'sending') return;
	attempt = 'none';
	record = 'none';
};

export const serverRejects = () => {
	if (attempt !== 'sending') return;
	attempt = 'none';
	persistUploadError();
};

export const userCancels = () => {
	if (record === 'none' || attempt === 'preparing') return;
	queued = false;
	record = 'none';
	attempt = 'none';
};

export const appRestarts = () => {
	queued = false;
	attempt = 'none';
	persistUploadError();
};

/** Once an upload of a file ends (sent, rejected, cancelled), sending that file again in the same Room is never refused as "Upload in progress". */
export const neverRefusedAfterUploadEnded = () => !refusedWithNothingInFlight;

/** An upload that is still running never shows as failed in the Room. */
export const runningUploadNeverShownFailed = () => attempt === 'none' || record !== 'failed';
