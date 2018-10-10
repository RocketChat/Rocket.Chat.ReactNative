import RNFetchBlob from 'rn-fetch-blob';
import * as SDK from '@rocket.chat/sdk';

import reduxStore from '../createStore';
import database from '../realm';

const promises = {};

function _ufsCreate(fileInfo) {
	return SDK.driver.asyncCall('ufsCreate', fileInfo);
}

function _ufsComplete(fileId, store, token) {
	return SDK.driver.asyncCall('ufsComplete', fileId, store, token);
}

function _sendFileMessage(rid, data, msg = {}) {
	return SDK.driver.asyncCall('sendFileMessage', rid, null, data, msg);
}

export function isUploadActive(path) {
	return !!promises[path];
}

export async function cancelUpload(path) {
	if (promises[path]) {
		await promises[path].cancel();
	}
}

export async function sendFileMessage(rid, fileInfo) {
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
			database.create('uploads', fileInfo, true);
		});

		const result = await _ufsCreate.call(this, fileInfo);

		promises[fileInfo.path] = RNFetchBlob.fetch('POST', result.url, {
			'Content-Type': 'octet-stream'
		}, data);
		// Workaround for https://github.com/joltup/rn-fetch-blob/issues/96
		setTimeout(() => {
			promises[fileInfo.path].uploadProgress((loaded, total) => {
				database.write(() => {
					fileInfo.progress = Math.floor((loaded / total) * 100);
					database.create('uploads', fileInfo, true);
				});
			});
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
		});

		database.write(() => {
			const upload = database.objects('uploads').filtered('path = $0', fileInfo.path);
			database.delete(upload);
		});
	} catch (e) {
		database.write(() => {
			fileInfo.error = true;
			database.create('uploads', fileInfo, true);
		});
	}
}
