import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { settings as RocketChatSettings } from '@rocket.chat/sdk';

import database from '../database';
import log from '../../utils/log';

const uploadQueue = {};

export function isUploadActive(path) {
	return !!uploadQueue[path];
}

export async function cancelUpload(item) {
	if (uploadQueue[item.path]) {
		uploadQueue[item.path].abort();
		try {
			const db = database.active;
			await db.action(async() => {
				await item.destroyPermanently();
			});
		} catch (e) {
			log(e);
		}
		delete uploadQueue[item.path];
	}
}

export function sendFileMessage(rid, fileInfo, tmid, server, user) {
	return new Promise(async(resolve, reject) => {
		try {
			const { id, token } = user;

			const uploadUrl = `${ server }/api/v1/rooms.upload/${ rid }`;

			const xhr = new XMLHttpRequest();
			const formData = new FormData();

			fileInfo.rid = rid;

			const db = database.active;
			const uploadsCollection = db.collections.get('uploads');
			let uploadRecord;
			try {
				uploadRecord = await uploadsCollection.find(fileInfo.path);
			} catch (error) {
				try {
					await db.action(async() => {
						uploadRecord = await uploadsCollection.create((u) => {
							u._raw = sanitizedRaw({ id: fileInfo.path }, uploadsCollection.schema);
							Object.assign(u, fileInfo);
							u.subscription.id = rid;
						});
					});
				} catch (e) {
					return log(e);
				}
			}

			uploadQueue[fileInfo.path] = xhr;
			xhr.open('POST', uploadUrl);

			formData.append('file', {
				uri: fileInfo.path,
				type: fileInfo.type,
				name: encodeURI(fileInfo.name) || 'fileMessage'
			});

			if (fileInfo.description) {
				formData.append('description', fileInfo.description);
			}

			if (tmid) {
				formData.append('tmid', tmid);
			}

			xhr.setRequestHeader('X-Auth-Token', token);
			xhr.setRequestHeader('X-User-Id', id);
			const { customHeaders } = RocketChatSettings;
			Object.keys(customHeaders).forEach((key) => {
				xhr.setRequestHeader(key, customHeaders[key]);
			});

			xhr.upload.onprogress = async({ total, loaded }) => {
				try {
					await db.action(async() => {
						await uploadRecord.update((u) => {
							u.progress = Math.floor((loaded / total) * 100);
						});
					});
				} catch (e) {
					log(e);
				}
			};

			xhr.onload = async() => {
				if (xhr.status >= 200 && xhr.status < 400) { // If response is all good...
					try {
						await db.action(async() => {
							await uploadRecord.destroyPermanently();
						});
						const response = JSON.parse(xhr.response);
						resolve(response);
					} catch (e) {
						log(e);
					}
				} else {
					try {
						await db.action(async() => {
							await uploadRecord.update((u) => {
								u.error = true;
							});
						});
					} catch (e) {
						log(e);
					}
					try {
						const response = JSON.parse(xhr.response);
						reject(response);
					} catch (e) {
						reject(e);
					}
				}
			};

			xhr.onerror = async(error) => {
				try {
					await db.action(async() => {
						await uploadRecord.update((u) => {
							u.error = true;
						});
					});
				} catch (e) {
					log(e);
				}
				reject(error);
			};

			xhr.send(formData);
		} catch (e) {
			log(e);
		}
	});
}
