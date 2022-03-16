import { TextProps } from 'react-native';

import { TUserStatus } from '../../definitions/UserStatus';

export interface IStatus extends TextProps {
	id: string;
	size: number;
	status: TUserStatus;
}
