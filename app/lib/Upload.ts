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
		[roomKey: string]: {
			interval?: number;
			files: IFileInfo[];
		};
	} = {};

	private isUploadingAnotherFile = ({ roomKey, files }: { roomKey: string; files: IFileInfo[] }): boolean => {
		const room = this.getRoom({ roomKey });
		return room.files.some(classFile => files.some(file => file.name !== classFile.name));
	};

	private getRoom = ({ roomKey }: { roomKey: string }) => this.rooms[roomKey];

	private getRoomKey = ({ rid, tmid }: { rid: string; tmid: string }): string => tmid || rid;

	private startUploading = ({ rid, tmid, files }: { rid: string; tmid: string; files: any[] }) => {
		const roomKey = this.getRoomKey({ rid, tmid });
		const room = this.getRoom({ roomKey });
		if (!room) {
			this.rooms[roomKey] = {
				files: []
			};
		}
		this.rooms[roomKey].files = [...this.rooms[roomKey].files, ...files];
		if (!this.rooms[roomKey].interval) {
			this.rooms[roomKey].interval = setInterval(() => {
				RocketChat.emitUserActivity({ room: rid, extras: { tmid }, performing: true, activity: USER_UPLOADING });
			}, 2000);
		}
	};

	private stopUploading = ({ rid, tmid, files }: { rid: string; tmid: string; files: IFileInfo[] }) => {
		const roomKey = this.getRoomKey({ rid, tmid });
		const room = this.getRoom({ roomKey });
		if (this.isUploadingAnotherFile({ roomKey, files })) {
			this.rooms[roomKey].files = this.rooms[roomKey].files.filter(
				classFile => !files.some(file => file.name === classFile.name)
			);
		} else {
			RocketChat.emitUserActivity({ room: rid, extras: { tmid }, performing: false, activity: USER_UPLOADING });
			clearInterval(room.interval);
			delete this.rooms[roomKey];
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
