import { Q } from '@nozbe/watermelondb';
import * as FileSystem from 'expo-file-system/legacy';
import { call, delay, race, take } from 'typed-redux-saga';

import { LOGIN, LOGOUT, ROOMS, SERVER } from '../actions/actionsTypes';
import type { IUser, TSendFileMessageFileInfo, TUploadModel } from '../definitions';
import database from '../lib/database';
import { getSubscriptionByRoomId } from '../lib/database/services/Subscription';
import { getUploadByPath } from '../lib/database/services/Upload';
import { Encryption } from '../lib/encryption';
import { appSelector } from '../lib/hooks/useAppSelector';
import log from '../lib/methods/helpers/log';
import { sendFileMessage } from '../lib/methods/sendFileMessage';
import { isUploadActive } from '../lib/methods/sendFileMessage/utils';

export const ROOMS_SYNC_WAIT_MS = 10000;

const getUploadsToResend = () =>
	database.active
		.get('uploads')
		.query(Q.where('error', true), Q.where('retry_on_reconnect', true), Q.sortBy('ts', Q.asc))
		.fetch();

const stopRetrying = (upload: TUploadModel) =>
	database.active.write(async () => {
		await upload.update(u => {
			u.retryOnReconnect = false;
		});
	});

const canEncryptFile = async (rid: string) => {
	const subscription = await getSubscriptionByRoomId(rid);
	if (!subscription?.encrypted) {
		return true;
	}
	const roomE2E = await Encryption.getRoomInstance(rid);
	return !!roomE2E?.hasSessionKey();
};

const attemptUpload = (upload: TUploadModel, rid: string, server: string, user: Partial<Pick<IUser, 'id' | 'token'>>) =>
	sendFileMessage(rid, upload.asPlain() as TSendFileMessageFileInfo, upload.tmid, server, user).then(
		() => false,
		() => true
	);

function* resendUpload(queued: TUploadModel, server: string, user: Partial<Pick<IUser, 'id' | 'token'>>) {
	const upload = yield* call(getUploadByPath, queued.id);
	if (!upload?.error || !upload.retryOnReconnect) {
		return false;
	}
	const rid = upload.subscription?.id;
	if (!rid || isUploadActive(upload.path, rid)) {
		return false;
	}
	const { exists } = yield* call(FileSystem.getInfoAsync, upload.path);
	if (!exists) {
		yield* call(stopRetrying, upload);
		return false;
	}
	if (!(yield* call(canEncryptFile, rid))) {
		return false;
	}
	return yield* call(attemptUpload, upload, rid, server, user);
}

function* resendAll() {
	yield* race({
		roomsSynced: take([ROOMS.SUCCESS, ROOMS.FAILURE]),
		timeout: delay(ROOMS_SYNC_WAIT_MS)
	});
	const uploads = yield* call(getUploadsToResend);
	const server = yield* appSelector(state => state.server.server);
	const user = yield* appSelector(state => state.login.user);
	for (const upload of uploads) {
		let failed = false;
		try {
			failed = yield* call(resendUpload, upload, server, user);
		} catch (e) {
			log(e);
		}
		if (failed && upload.retryOnReconnect) {
			return;
		}
	}
}

export function* resendFailedUploads() {
	try {
		yield* race({
			resend: call(resendAll),
			stop: take([LOGOUT, SERVER.SELECT_REQUEST, LOGIN.SUCCESS])
		});
	} catch (e) {
		log(e);
	}
}
