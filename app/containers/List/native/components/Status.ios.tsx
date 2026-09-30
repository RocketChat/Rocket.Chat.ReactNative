import { type TUserStatus } from '~/definitions';
import { useUserStatusColor } from '~/lib/hooks/useUserStatusColor';
import { useTheme } from '~/theme';
import { getStatusIconName } from '~/containers/Status/getStatusIconName';
import NativeListIcon from './Icon.ios';

const NativeListStatus = ({ status }: { status: TUserStatus }) => {
	const { colors } = useTheme();
	const statusColor = useUserStatusColor(status);

	return <NativeListIcon name={getStatusIconName(status)} color={statusColor ?? colors.userPresenceOffline} />;
};

export default NativeListStatus;
