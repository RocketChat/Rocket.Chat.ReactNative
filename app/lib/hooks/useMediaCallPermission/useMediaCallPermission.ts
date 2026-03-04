import { useAppSelector } from '../useAppSelector';
import { usePermissions } from '../usePermissions';

export const useMediaCallPermission = () => {
	// const enterpriseModules = useAppSelector(state => state.enterpriseModules);
	const isVoipModuleAvailable = true; // enterpriseModules.includes('teams-voip');
	const [allowInternalVoiceCall, allowExternalVoiceCall] = usePermissions([
		'allow-internal-voice-calls',
		'allow-external-voice-calls'
	]);
	return isVoipModuleAvailable && (allowInternalVoiceCall || allowExternalVoiceCall);
};
