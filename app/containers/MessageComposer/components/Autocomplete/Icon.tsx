import RoomTypeIcon from '../../../RoomTypeIcon';

export const Icon = ({ item, type }) =>
	type === '@' || type === '#' ? <RoomTypeIcon userId={item.id} type={item.t} status={item.status} size={16} /> : null;
