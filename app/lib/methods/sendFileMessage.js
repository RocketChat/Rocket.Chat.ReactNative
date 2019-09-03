import database from '../realm';
import log from '../../utils/log';

const uploadQueue = {};

export function isUploadActive(path) {
	return !!uploadQueue[path];
}

export function cancelUpload(path) {
	if (uploadQueue[path]) {
		uploadQueue[path].abort();
		database.write(() => {
			const upload = database.objects('uploads').filtered('path = $0', path);
			try {
				database.delete(upload);
			} catch (e) {
				log(e);
			}
		});
		delete uploadQueue[path];
	}
}

export function sendFileMessage(rid, fileInfo, tmid, server, user) {
	return new Promise((resolve, reject) => {
		try {
			const { serversDB } = database.databases;
			const { FileUpload_MaxFileSize, id: Site_Url } = serversDB.objectForPrimaryKey('servers', server);
			const { id, token } = user;

			// -1 maxFileSize means there is no limit
			if (FileUpload_MaxFileSize > -1 && fileInfo.size > FileUpload_MaxFileSize) {
				return reject({ error: 'error-file-too-large' }); // eslint-disable-line
			}

			const uploadUrl = `${ Site_Url }/api/v1/rooms.upload/${ rid }`;

			const xhr = new XMLHttpRequest();
			const formData = new FormData();

			fileInfo.rid = rid;

			database.write(() => {
				try {
					database.create('uploads', fileInfo, true);
				} catch (e) {
					return log(e);
				}
			});

			uploadQueue[fileInfo.path] = xhr;
			xhr.open('POST', uploadUrl);

			formData.append('file', {
				uri: fileInfo.path,
				type: fileInfo.type,
				name: fileInfo.name || 'fileMessage'
			});

			if (fileInfo.description) {
				formData.append('description', fileInfo.description);
			}

			if (tmid) {
				formData.append('tmid', tmid);
			}

			xhr.setRequestHeader('X-Auth-Token', token);
			xhr.setRequestHeader('X-User-Id', id);

			xhr.upload.onprogress = ({ total, loaded }) => {
				database.write(() => {
					fileInfo.progress = Math.floor((loaded / total) * 100);
					try {
						database.create('uploads', fileInfo, true);
					} catch (e) {
						return log(e);
					}
				});
			};

			xhr.onload = () => {
				if (xhr.status >= 200 && xhr.status < 400) { // If response is all good...
					database.write(() => {
						const upload = database.objects('uploads').filtered('path = $0', fileInfo.path);
						try {
							database.delete(upload);
							const response = JSON.parse(xhr.response);
							resolve(response);
						} catch (e) {
							reject(e);
							log(e);
						}
					});
				} else {
					database.write(() => {
						fileInfo.error = true;
						try {
							database.create('uploads', fileInfo, true);
							const response = JSON.parse(xhr.response);
							reject(response);
						} catch (e) {
							reject(e);
							log(e);
						}
					});
				}
			};

			xhr.onerror = (error) => {
				database.write(() => {
					fileInfo.error = true;
					try {
						database.create('uploads', fileInfo, true);
						reject(error);
					} catch (e) {
						reject(e);
						log(e);
					}
				});
			};

			xhr.send(formData);
		} catch (e) {
			log(e);
		}
	});
}
