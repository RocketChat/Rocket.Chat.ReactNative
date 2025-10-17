import { type TextProps } from 'react-native';

import { type TUserStatus } from '../../definitions';

export interface IStatus extends TextProps {
	id: string;
	size: number;
	status?: TUserStatus | null;
}

export interface IStatusComponentProps extends Omit<IStatus, 'id' | 'size' | 'status'> {
	size?: number;
	status?: TUserStatus;
}
