import { satisfies } from 'semver';

import { ISupportedVersions, LTSDictionary, LTSMessage, LTSVersion } from '../../definitions';
import builtInSupportedVersions from '../../../app-supportedversions.json';

interface IServerVersionCompatibilityResult {
	success: boolean;
	messages?: LTSMessage[];
	i18n?: LTSDictionary;
}

export const checkServerVersionCompatibility = function ({
	supportedVersions,
	serverVersion
}: {
	supportedVersions?: ISupportedVersions;
	serverVersion: string;
}): IServerVersionCompatibilityResult {
	// 1.2.3 -> ~1.2
	const serverVersionTilde = `~${serverVersion.split('.').slice(0, 2).join('.')}`;

	if (!supportedVersions) {
		return { success: false };
	}

	// Built-in suported versions
	if (supportedVersions.timestamp < builtInSupportedVersions.timestamp) {
		const versionInfo = builtInSupportedVersions.versions.find(({ version }) =>
			satisfies(version, serverVersionTilde)
		) as LTSVersion;
		if (!versionInfo || new Date(versionInfo.expiration) < new Date()) {
			return {
				success: false,
				messages: versionInfo?.messages
			};
		}

		return {
			success: true,
			messages: versionInfo?.messages
		};
	}

	// Backend/Cloud
	const versionInfo = supportedVersions.versions.find(({ version }) => satisfies(version, serverVersionTilde));
	if (!versionInfo || new Date(versionInfo.expiration) < new Date()) {
		// Exceptions
		const exception = supportedVersions.exceptions?.versions.find(({ version }) => satisfies(version, serverVersionTilde));
		if (!exception || new Date(exception.expiration) < new Date()) {
			return {
				success: false,
				messages: versionInfo?.messages
			};
		}
	}

	return {
		success: true,
		messages: versionInfo?.messages
	};
};
