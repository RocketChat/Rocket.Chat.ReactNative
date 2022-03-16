import { TextProps } from 'react-native';

import { TUserStatus } from '../../definitions/TUserStatus';

export interface IStatus extends TextProps {
	id: string;
	size: number;
	status: TUserStatus;
}
