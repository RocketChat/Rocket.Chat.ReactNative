import { SUPPORTED_VERSIONS_KEY } from '../constants';
import UserPreferences from './userPreferences';
import { ISupportedVersions } from '../../definitions';

export const updateCurrentSupportedVersions = (newSupportedVersions: ISupportedVersions): ISupportedVersions => {
	const currentSupportedVersions = UserPreferences.getMap(SUPPORTED_VERSIONS_KEY) as ISupportedVersions;
	if (!currentSupportedVersions) {
		UserPreferences.setMap(SUPPORTED_VERSIONS_KEY, newSupportedVersions);
		return newSupportedVersions;
	}

	const { timestamp: currentTimestamp } = currentSupportedVersions;
	const { timestamp: newTimestamp } = newSupportedVersions;
	if (newTimestamp > currentTimestamp) {
		UserPreferences.setMap(SUPPORTED_VERSIONS_KEY, newSupportedVersions);
		return newSupportedVersions;
	}

	return currentSupportedVersions;
};
