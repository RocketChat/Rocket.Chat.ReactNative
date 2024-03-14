import type { IconProps } from 'react-native-vector-icons/Icon';

import { TUserStatus } from '../../definitions';

export interface IStatus extends IconProps {
	id: string;
	size: number;
	status?: TUserStatus | null;
}

export interface IStatusComponentProps extends Omit<IStatus, 'id' | 'size' | 'status'> {
	size?: number;
	status?: TUserStatus;
}
