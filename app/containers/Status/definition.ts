import { TextProps } from 'react-native';

import { TUserStatus } from '../../definitions';

export interface IStatus extends TextProps {
	id: string;
	size: number;
	status: TUserStatus;
}
