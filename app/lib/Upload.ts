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

	private rooms: {
		[key: string]: number;
	} = {};

	private isUploadingAnotherFile = ({ rid, fileKey }: { rid: string; fileKey: string }): boolean =>
		Object.keys(this.intervals).some(key => key !== fileKey && key.match(new RegExp(rid)));

	private getRoom = ({ rid, tmid }: { rid: string; tmid: string }) => this.rooms[tmid || rid];

	private startUploading = ({ rid, tmid }: { rid: string; tmid: string }) => {
		const room = this.getRoom({ rid, tmid });
		if (!room) {
			this.rooms[tmid || rid] = setInterval(() => {
				RocketChat.emitUserActivity({ room: rid, extras: { tmid }, performing: true, activity: USER_UPLOADING });
			}, 2000);
		}
	};

	private stopUploading = ({ rid, tmid }: { rid: string; tmid: string }) => {
		const room = this.getRoom({ rid, tmid });
		// if (!this.isUploadingAnotherFile({ rid: roomId, fileKey })) {
		RocketChat.emitUserActivity({ room: rid, extras: { tmid }, performing: false, activity: USER_UPLOADING });
		clearInterval(room);
		delete this.rooms[tmid || rid];
		// }
	};

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

	async send({ rid, tmid, files }: { rid: string; tmid: string; files: unknown[] }) {
		console.log('Upload.send Upload.send Upload.send Upload.send Upload.send ', rid, tmid, files);
		const { server } = reduxStore.getState().server;
		const { user } = reduxStore.getState().login;

		try {
			// const room = this.getRoom({ rid, tmid });
			// if (!room) {
			// 	this.rooms[tmid || rid] = {}
			// }
			// if (this.canUploadFile(fileInfo)) {
			// this.userUploading({ rid, tmid, files, performing: true });
			this.startUploading({ rid, tmid });
			await new Promise(res => {
				setTimeout(() => {
					res();
				}, 25000);
			});
			// await RocketChat.sendFileMessage(rid, files[0], tmid, server, user);
			// this.userUploading({ rid, tmid, files, performing: false });
			this.stopUploading({ rid, tmid });
			// }
		} catch (e) {
			// this.userUploading({ rid, tmid, files, performing: false });
			this.stopUploading({ rid, tmid });
			console.error(e);
		}
	}
}

export const Upload = new UploadClass();
