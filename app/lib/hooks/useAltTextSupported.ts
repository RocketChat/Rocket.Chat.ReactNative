import { useAppSelector } from './useAppSelector';
import { compareServerVersion } from '../methods/helpers/compareServerVersion';

export const useAltTextSupported = (): boolean => {
	const serverVersion = useAppSelector(state => state.server.version);
	return compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '8.4.0');
};
