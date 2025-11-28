import { type TUserStatus } from './TUserStatus';

export interface ICustomUserStatus {
	_id: string;
	name: string;
	statusType: TUserStatus;
	_updatedAt: {
		$date: number;
	};
}
