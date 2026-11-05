import { isInPexipCall, useIsInPexipCall } from './videoConf/usePexipCallStore';
import { isInActiveVoipCall, useIsInActiveVoipCall } from './voip/isInActiveVoipCall';

export const isInAnyCall = (): boolean => isInActiveVoipCall() || isInPexipCall();

export const useIsInAnyCall = (): boolean => {
	const isInVoipCall = useIsInActiveVoipCall();
	const isInPexip = useIsInPexipCall();
	return isInVoipCall || isInPexip;
};
