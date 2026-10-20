import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { getUserSelector } from '~/selectors/login';
import { useTheme } from '~/theme';

export const useMenuButtonState = () => {
	const { colors } = useTheme();
	const supportedVersionsStatus = useAppSelector(state => state.supportedVersions.status);
	const requirePasswordChange = useAppSelector(state => getUserSelector(state).requirePasswordChange);
	const notificationPresenceCap = useAppSelector(state => state.app.notificationPresenceCap);

	const disabled = supportedVersionsStatus === 'expired' || !!requirePasswordChange;
	const badgeColor =
		supportedVersionsStatus === 'warn'
			? colors.buttonBackgroundDangerDefault
			: notificationPresenceCap
				? colors.userPresenceDisabled
				: undefined;

	return { disabled, badgeColor };
};
