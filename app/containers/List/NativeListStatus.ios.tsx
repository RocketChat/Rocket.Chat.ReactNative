import { type TUserStatus } from '~/definitions';
import { useUserStatusColor } from '~/lib/hooks/useUserStatusColor';
import { useTheme } from '~/theme';
import { hasIcon, type TIconsName } from '../CustomIcon';
import NativeListIcon from './NativeListIcon.ios';

const statusIconName = (status: TUserStatus): TIconsName => {
	const name = `status-${status}`;
	return hasIcon(name) ? (name as TIconsName) : 'status-offline';
};

const NativeListStatus = ({ status }: { status: TUserStatus }) => {
	const { colors } = useTheme();
	const statusColor = useUserStatusColor(status);

	return <NativeListIcon name={statusIconName(status)} color={statusColor ?? colors.userPresenceOffline} />;
};

export default NativeListStatus;
