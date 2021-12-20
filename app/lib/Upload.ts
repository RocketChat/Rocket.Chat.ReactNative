import log from '../utils/log';
import RocketChat from './rocketchat';
import reduxStore from './createStore';
import { USER_UPLOADING } from '../constants/userActivities';

/**
 * TODO: We should evaluate this on the rearchitecture
 * We have sendFileMessage, fileUpload, etc
 */
class UploadClass {
	private rooms: {
		[key: string]: {
			interval?: number;
			files: object[];
		};
	} = {};

	private isUploadingAnotherFile = ({ rid, tmid, files }: { rid: string; tmid: string; files: unknown[] }): boolean => {
		const room = this.getRoom({ rid, tmid });
		return room.files.some((classFile: unknown) => files.some((file: unknown) => file.name !== classFile.name));
	};

	private getRoom = ({ rid, tmid }: { rid: string; tmid: string }) => this.rooms[tmid || rid];

	private startUploading = ({ rid, tmid, files }: { rid: string; tmid: string; files: any[] }) => {
		const room = this.getRoom({ rid, tmid });
		if (!room) {
			this.rooms[tmid || rid] = {
				files: []
			};
		}
		this.rooms[tmid || rid].files = [...this.rooms[tmid || rid].files, ...files];
		if (!this.rooms[tmid || rid].interval) {
			this.rooms[tmid || rid].interval = setInterval(() => {
				RocketChat.emitUserActivity({ room: rid, extras: { tmid }, performing: true, activity: USER_UPLOADING });
			}, 2000);
		}
	};

	private stopUploading = ({ rid, tmid, files }: { rid: string; tmid: string; files: unknown[] }) => {
		const room = this.getRoom({ rid, tmid });
		if (this.isUploadingAnotherFile({ rid, tmid, files })) {
			this.rooms[tmid || rid].files = this.rooms[tmid || rid].files.filter(
				classFile => !files.some(file => file.name === classFile.name)
			);
		} else {
			RocketChat.emitUserActivity({ room: rid, extras: { tmid }, performing: false, activity: USER_UPLOADING });
			clearInterval(room.interval);
			delete this.rooms[tmid || rid];
		}
	};

	async send({ rid, tmid, files }: { rid: string; tmid: string; files: unknown[] }) {
		const { server } = reduxStore.getState().server;
		const { user } = reduxStore.getState().login;

		try {
			// const room = this.getRoom({ rid, tmid });
			// if (!room) {
			// 	this.rooms[tmid || rid] = {}
			// }
			// if (this.canUploadFile(fileInfo)) {
			// this.userUploading({ rid, tmid, files, performing: true });
			this.startUploading({ rid, tmid, files });
			await new Promise(res => {
				setTimeout(() => {
					console.log('end', files);
					res();
				}, 15000);
			});
			// await RocketChat.sendFileMessage(rid, files[0], tmid, server, user);
			// this.userUploading({ rid, tmid, files, performing: false });
			this.stopUploading({ rid, tmid, files });
			// }
		} catch (e) {
			// this.userUploading({ rid, tmid, files, performing: false });
			this.stopUploading({ rid, tmid, files });
			console.error(e);
		}
	}
}

export const Upload = new UploadClass();
