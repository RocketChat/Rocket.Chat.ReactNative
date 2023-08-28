import { satisfies } from 'semver';

import { ISupportedVersions } from '../../definitions';
import supportedVersionsBuild from '../../../app-supportedversions.json';

export const checkServerVersionCompatibility = function ({
	supportedVersions,
	serverVersion
}: {
	supportedVersions?: ISupportedVersions;
	serverVersion: string;
}): boolean {
	// 1.2.3 -> ~1.2
	const serverVersionTilde = `~${serverVersion.split('.').slice(0, 2).join('.')}`;

	if (!supportedVersions) {
		return false;
	}

	if (supportedVersions.timestamp < supportedVersionsBuild.timestamp) {
		const versionInfo = supportedVersionsBuild.versions.find(({ version }) => satisfies(version, serverVersionTilde));
		if (!versionInfo || new Date(versionInfo.expiration) < new Date()) {
			return false;
		}
	}

	const versionInfo = supportedVersions.versions.find(({ version }) => satisfies(version, serverVersionTilde));
	if (!versionInfo) {
		return false;
	}

	if (new Date(versionInfo.expiration) < new Date()) {
		const exception = supportedVersions.exceptions?.versions.find(({ version }) => satisfies(version, serverVersionTilde));
		if (!exception || new Date(exception.expiration) < new Date()) {
			return false;
		}
	}

	return true;
};
