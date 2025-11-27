import { type TUserStatus } from './TUserStatus';
import { type Model } from '@nozbe/watermelondb';

export interface ICustomUserStatus {
	_id: string;
	name: string;
	statusType: TUserStatus;
	_updatedAt: {
        $date: number;
    };
}

export type TCustomUserStatusModel = ICustomUserStatus & Model;
