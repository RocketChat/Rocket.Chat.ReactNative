import log from '../utils/log';
import RocketChat from './rocketchat';
import { USER_RECORDING, USER_TYPING, USER_UPLOADING } from '../constants/userActivities';

// TODO: evaluate it later
interface IFileInfo {
	name: string;
	description?: string;
	// mime: string;
	type: string;
	store: string;
	path: string;
	size: number;
}

/**
 * TODO: We should evaluate this on the rearchitecture
 * We have sendFileMessage, fileUpload, etc
 */
class UserActivityClass {
	private rooms: {
		[roomKey: string]: {
			interval?: number;
			files: IFileInfo[];
		};
	} = {};
	private typingRemove?: number;
	private recordingRemove?: number;
	private recordingSend?: number;

	userTyping = async ({ rid, tmid, performing }: { rid: string; tmid: string; performing: boolean }) => {
		if (this.typingRemove) {
			clearTimeout(this.typingRemove);
			this.typingRemove = 0;
		}

		if (performing) {
			this.typingRemove = setTimeout(() => {
				this.userTyping({ rid, tmid, performing: false });
			}, 5000);
		}

		try {
			await RocketChat.emitUserActivity({ room: rid, extras: { tmid }, performing, activity: USER_TYPING });
		} catch (e) {
			log(e);
		}
	};

	userRecording = ({ rid, tmid, performing }: { rid: string; tmid: string; performing: boolean }) => {
		if (this.recordingRemove) {
			clearTimeout(this.recordingRemove);
			this.recordingRemove = 0;
		}

		if (performing) {
			this.recordingRemove = setTimeout(() => {
				this.userRecording({ rid, tmid, performing: false });
			}, 5000);
		}

		if (this.recordingSend && performing) {
			return;
		}

		if (this.recordingSend && !performing) {
			clearTimeout(this.recordingSend);
		}

		this.recordingSend = setTimeout(
			() => {
				this.recordingSend = 0;
				RocketChat.emitUserActivity({ room: rid, extras: { tmid }, performing, activity: USER_RECORDING });
			},
			performing ? 2000 : 100
		);
	};

	private isUploadingAnotherFile = ({ roomKey, files }: { roomKey: string; files: IFileInfo[] }): boolean => {
		const room = this.getRoom({ roomKey });
		if (room.files.length === files.length) {
			return !room.files.every(classFile => files.some(file => file.name === classFile.name));
		}
		return room.files.some(classFile => files.some(file => file.name !== classFile.name));
	};

	private getRoom = ({ roomKey }: { roomKey: string }) => this.rooms[roomKey];

	private getRoomKey = ({ rid, tmid }: { rid: string; tmid?: string }): string => tmid || rid;

	private startUploadActivity = ({ rid, tmid, files }: { rid: string; tmid?: string; files: IFileInfo[] }) => {
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

	private stopUploadActivity = ({ rid, tmid, files }: { rid: string; tmid?: string; files: IFileInfo[] }) => {
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

	async upload({
		rid,
		tmid,
		files,
		server,
		user
	}: {
		rid: string;
		tmid?: string;
		files: IFileInfo[];
		server: string;
		user: { id: string; token: string };
	}) {
		try {
			this.startUploadActivity({ rid, tmid, files });
			// await new Promise(res => {setTimeout(() => {console.log('end', files);res();}, 15000);});
			await Promise.all(files.map(file => RocketChat.sendFileMessage(rid, file, tmid, server, user)));
			this.stopUploadActivity({ rid, tmid, files });
		} catch (e) {
			this.stopUploadActivity({ rid, tmid, files });
			log(e);
		}
	}
}

export const UserActivity = new UserActivityClass();
