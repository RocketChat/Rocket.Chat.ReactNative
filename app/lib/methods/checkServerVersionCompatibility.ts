import { ISupportedVersions } from '../../definitions';
import supportedVersionsBuild from '../../../app-supportedversions.json';

export const checkServerVersionCompatibility = function ({
	supportedVersions,
	serverVersion
}: {
	supportedVersions?: ISupportedVersions;
	serverVersion: string;
}): boolean {
	if (!supportedVersions) {
		return false;
	}

	if (supportedVersions.timestamp < supportedVersionsBuild.timestamp) {
		const versionInfo = supportedVersionsBuild.versions.find(({ version }) => version === serverVersion);
		if (!versionInfo || new Date(versionInfo.expiration) < new Date()) {
			return false;
		}
	}

	const versionInfo = supportedVersions.versions.find(({ version }) => version === serverVersion);
	if (!versionInfo) {
		return false;
	}

	if (new Date(versionInfo.expiration) < new Date()) {
		const exception = supportedVersions.exceptions?.versions.find(({ version }) => version === serverVersion);
		if (!exception || new Date(exception.expiration) < new Date()) {
			return false;
		}
	}

	return true;
};
