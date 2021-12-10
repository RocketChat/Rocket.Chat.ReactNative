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
	userUploading = ({ rid, tmid, performing, files }: { rid: string; tmid: string; files: any[]; performing: boolean }) => {
		// const { uploadingSend, uploadingRemove, uploadings } = this.props;
		const { uploadingSend: uploading } = reduxStore.getState().room;

		files.forEach(file => {
			if (!file) {
				return;
			}

			// Name that will be the key at state from redux
			const nameUploaded = `${tmid || rid}-${file.name}`;

			if (performing && uploading[nameUploaded]) {
				return;
			}

			if (performing) {
				RocketChat.emitUserActivity({ room: rid, extras: { tmid }, performing, activity: USER_UPLOADING });
				const intervalValue = setInterval(() => {
					RocketChat.emitUserActivity({ room: rid, extras: { tmid }, performing, activity: USER_UPLOADING });
				}, 2000);
				dispatch(uploadingSend(nameUploaded, intervalValue));
			}

			if (!performing) {
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
			// await RocketChat.sendFileMessage(rid, files[0], tmid, server, user);
			// userUploading({ rid, tmid, performing: false, filesName });
			// }
		} catch (e) {
			// userUploading({ rid, tmid, performing: false, filesName });
			console.error(e);
		}
	}
}

export const Upload = new UploadClass();
