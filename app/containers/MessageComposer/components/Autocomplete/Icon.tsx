import { useEffect } from 'react';

import { useUserStatus } from '../../../../lib/hooks';
import { getUserPresence } from '../../../../lib/methods';
import RoomTypeIcon from '../../../RoomTypeIcon';

export const Icon = ({ item, type }) => {
	console.log('🚀 ~ file: icon.tsx:8 ~ Icon ~ item:', item);
	const { status } = useUserStatus(item.t, undefined, item.id);

	console.log('🚀 ~ file: icon.tsx:12 ~ Icon ~ status ?? item.status:', item.status);
	return type === '@' || type === '#' ? <RoomTypeIcon type={item.t} status={item.status} size={16} /> : null;
};
