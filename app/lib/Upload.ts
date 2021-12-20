import log from '../utils/log';
import RocketChat from './rocketchat';
import { USER_UPLOADING } from '../constants/userActivities';

// TODO: evaluate it later
interface IFileInfo {
	name: string;
	mime: string;
	type: string;
	store: string;
	path: string;
	size: number;
}

/**
 * TODO: We should evaluate this on the rearchitecture
 * We have sendFileMessage, fileUpload, etc
 */
class UploadClass {
	private rooms: {
		[key: string]: {
			interval?: number;
			files: IFileInfo[];
		};
	} = {};

	private isUploadingAnotherFile = ({ rid, tmid, files }: { rid: string; tmid: string; files: IFileInfo[] }): boolean => {
		const room = this.getRoom({ rid, tmid });
		return room.files.some(classFile => files.some(file => file.name !== classFile.name));
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

	private stopUploading = ({ rid, tmid, files }: { rid: string; tmid: string; files: IFileInfo[] }) => {
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

	async send({
		rid,
		tmid,
		files,
		server,
		user
	}: {
		rid: string;
		tmid: string;
		files: IFileInfo[];
		server: string;
		user: { id: string; token: string };
	}) {
		try {
			this.startUploading({ rid, tmid, files });
			// await new Promise(res => {
			// 	setTimeout(() => {
			// 		console.log('end', files);
			// 		res();
			// 	}, 15000);
			// });
			await RocketChat.sendFileMessage(rid, files[0], tmid, server, user);
			this.stopUploading({ rid, tmid, files });
		} catch (e) {
			this.stopUploading({ rid, tmid, files });
			log(e);
		}
	}
}

export const Upload = new UploadClass();
