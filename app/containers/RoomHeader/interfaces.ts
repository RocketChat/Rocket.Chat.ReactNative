import { USER_TYPING, USER_RECORDING, USER_UPLOADING } from '../../constants/userActivities';

export interface IUsersActivity {
	[roomId: string]: {
		username: string;
		activity: typeof USER_TYPING | typeof USER_RECORDING | typeof USER_UPLOADING;
		count: number;
	};
}
