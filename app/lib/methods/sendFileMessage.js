import RNFetchBlob from 'rn-fetch-blob';

import reduxStore from '../createStore';
import database from '../realm';
import log from '../../utils/log';

const promises = {};

function _ufsCreate(fileInfo) {
	return this.sdk.methodCall('ufsCreate', fileInfo);
}

function _ufsComplete(fileId, store, token) {
	return this.sdk.methodCall('ufsComplete', fileId, store, token);
}

function _sendFileMessage(rid, data, msg = {}) {
	// RC 0.22.0
	return this.sdk.methodCall('sendFileMessage', rid, null, data, msg);
}

export function isUploadActive(path) {
	return !!promises[path];
}

export async function cancelUpload(path) {
	if (promises[path]) {
		await promises[path].cancel();
	}
}

export async function sendFileMessage(rid, fileInfo, tmid) {
	try {
		const data = await RNFetchBlob.wrap(fileInfo.path);
		if (!fileInfo.size) {
			const fileStat = await RNFetchBlob.fs.stat(fileInfo.path);
			fileInfo.size = fileStat.size;
			fileInfo.name = fileStat.filename;
		}

		const { FileUpload_MaxFileSize } = reduxStore.getState().settings;

		// -1 maxFileSize means there is no limit
		if (FileUpload_MaxFileSize > -1 && fileInfo.size > FileUpload_MaxFileSize) {
			return Promise.reject({ error: 'error-file-too-large' }); // eslint-disable-line
		}

		fileInfo.rid = rid;

		database.write(() => {
			try {
				database.create('uploads', fileInfo, true);
			} catch (e) {
				return log('sendFileMessage -> create uploads 1', e);
			}
		});

		const result = await _ufsCreate.call(this, fileInfo);

		promises[fileInfo.path] = RNFetchBlob.fetch('POST', result.url, {
			'Content-Type': 'octet-stream'
		}, data);
		// Workaround for https://github.com/joltup/rn-fetch-blob/issues/96
		setTimeout(() => {
			if (promises[fileInfo.path] && promises[fileInfo.path].uploadProgress) {
				promises[fileInfo.path].uploadProgress((loaded, total) => {
					database.write(() => {
						fileInfo.progress = Math.floor((loaded / total) * 100);
						try {
							database.create('uploads', fileInfo, true);
						} catch (e) {
							return log('sendFileMessage -> create uploads 2', e);
						}
					});
				});
			}
		});
		await promises[fileInfo.path];

		const completeResult = await _ufsComplete.call(this, result.fileId, fileInfo.store, result.token);

		await _sendFileMessage.call(this, completeResult.rid, {
			_id: completeResult._id,
			type: completeResult.type,
			size: completeResult.size,
			name: completeResult.name,
			description: completeResult.description,
			url: completeResult.path
		}, {
			tmid
		});

		database.write(() => {
			const upload = database.objects('uploads').filtered('path = $0', fileInfo.path);
			try {
				database.delete(upload);
			} catch (e) {
				log('sendFileMessage -> delete uploads', e);
			}
		});
	} catch (e) {
		database.write(() => {
			fileInfo.error = true;
			try {
				database.create('uploads', fileInfo, true);
			} catch (err) {
				log('sendFileMessage -> create uploads 3', err);
			}
		});
	}
}
