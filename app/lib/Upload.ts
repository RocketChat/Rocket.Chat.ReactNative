import log from '../utils/log';
import RocketChat from './rocketchat';
import reduxStore from './createStore';
import { uploadingSend, uploadingRemove } from '../actions/room';
import { USER_UPLOADING } from '../constants/userActivities';

const { dispatch } = reduxStore;

/**
 * TODO: We should evaluate this on the rearchitecture
 * We have sendFileMessage, fileUpload, etc
 */
class UploadClass {
	private intervals: { [key: string]: number } = {};

	userUploading = ({ rid, tmid, performing, files }: { rid: string; tmid: string; files: any[]; performing: boolean }) => {
		console.log('🚀 ~ file: Upload.ts ~ line 17 ~ UploadClass ~ tmid', tmid);
		// const { uploadingSend, uploadingRemove, uploadings } = this.props;
		const { uploadingSend: uploading } = reduxStore.getState().room;

		files.forEach(file => {
			if (!file) {
				return;
			}

			// Name that will be the key at state from redux
			const nameUploaded = `${tmid || rid}-${file.name}`;
			console.log('🚀 ~ file: Upload.ts ~ line 28 ~ UploadClass ~ nameUploaded', nameUploaded);

			if (performing && uploading[nameUploaded]) {
				return;
			}

			if (performing) {
				RocketChat.emitUserActivity({ room: rid, extras: { tmid }, performing, activity: USER_UPLOADING });
				console.log('🚀 ~ file: Upload.ts ~ line 36 ~ UploadClass ~ tmid', tmid);
				this.intervals[nameUploaded] = setInterval(() => {
					RocketChat.emitUserActivity({ room: rid, extras: { tmid }, performing, activity: USER_UPLOADING });
				}, 2000);
				dispatch(uploadingSend(nameUploaded));
			}

			if (!performing) {
				if (this.intervals[nameUploaded]) {
					clearInterval(this.intervals[nameUploaded]);
					delete this.intervals[nameUploaded];
				}
				dispatch(uploadingRemove(nameUploaded));
				RocketChat.emitUserActivity({ room: rid, extras: { tmid }, performing, activity: USER_UPLOADING });
			}
		});
	};

	async send({ rid, tmid, files }: { rid: string; tmid: string; files: any[] }) {
		console.log('Upload.send Upload.send Upload.send Upload.send Upload.send ', rid, tmid, files);
		const { server } = reduxStore.getState().server;
		const { user } = reduxStore.getState().login;

		try {
			// if (this.canUploadFile(fileInfo)) {
			// userUploading({ rid, tmid, performing: true, filesName });
			this.userUploading({ rid, tmid, files, performing: true });
			await new Promise(res => {
				setTimeout(() => {
					res();
				}, 25000);
			});
			// await RocketChat.sendFileMessage(rid, files[0], tmid, server, user);
			this.userUploading({ rid, tmid, files, performing: false });
			// userUploading({ rid, tmid, performing: false, filesName });
			// }
		} catch (e) {
			// userUploading({ rid, tmid, performing: false, filesName });
			this.userUploading({ rid, tmid, files, performing: false });
			console.error(e);
		}
	}
}

export const Upload = new UploadClass();
