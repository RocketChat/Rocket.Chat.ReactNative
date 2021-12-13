import log from '../utils/log';
import RocketChat from './rocketchat';
import reduxStore from './createStore';
import { USER_UPLOADING } from '../constants/userActivities';

/**
 * TODO: We should evaluate this on the rearchitecture
 * We have sendFileMessage, fileUpload, etc
 */
class UploadClass {
	private intervals: { [key: string]: number } = {};

	private isUploadingAnotherFile = ({ rid, fileKey }: { rid: string; fileKey: string }): boolean =>
		Object.keys(this.intervals).some(key => key !== fileKey && key.match(new RegExp(rid)));

	userUploading = ({ rid, tmid, performing, files }: { rid: string; tmid: string; files: any[]; performing: boolean }) => {
		console.log('🚀 ~ file: Upload.ts ~ line 14 ~ UploadClass ~ rid, tmid, performing, files', rid, tmid, performing, files);
		files.forEach(file => {
			if (!file) {
				return;
			}
			const roomId = tmid || rid;
			const fileKey = `${roomId}-${file.name}`;

			if (performing) {
				RocketChat.emitUserActivity({ room: rid, extras: { tmid }, performing, activity: USER_UPLOADING });
				this.intervals[fileKey] = setInterval(() => {
					RocketChat.emitUserActivity({ room: rid, extras: { tmid }, performing, activity: USER_UPLOADING });
				}, 2000);
			}

			if (!performing) {
				if (!this.isUploadingAnotherFile({ rid: roomId, fileKey })) {
					RocketChat.emitUserActivity({ room: rid, extras: { tmid }, performing, activity: USER_UPLOADING });
				}
				if (this.intervals[fileKey]) {
					clearInterval(this.intervals[fileKey]);
					delete this.intervals[fileKey];
				}
			}
		});
	};

	async send({ rid, tmid, files }: { rid: string; tmid: string; files: any[] }) {
		console.log('Upload.send Upload.send Upload.send Upload.send Upload.send ', rid, tmid, files);
		const { server } = reduxStore.getState().server;
		const { user } = reduxStore.getState().login;

		try {
			// if (this.canUploadFile(fileInfo)) {
			this.userUploading({ rid, tmid, files, performing: true });
			// await new Promise(res => {
			// 	setTimeout(() => {
			// 		res();
			// 	}, 25000);
			// });
			await RocketChat.sendFileMessage(rid, files[0], tmid, server, user);
			this.userUploading({ rid, tmid, files, performing: false });
			// }
		} catch (e) {
			this.userUploading({ rid, tmid, files, performing: false });
			console.error(e);
		}
	}
}

export const Upload = new UploadClass();
