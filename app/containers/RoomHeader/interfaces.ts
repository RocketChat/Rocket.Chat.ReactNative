import { userTyping, userRecording, userUploading } from '../../constants/userActivities';

export interface IUsersActivity {
	[key: string]: {
		username: string;
		activity: typeof userTyping | typeof userRecording | typeof userUploading;
		count: number;
	};
}
