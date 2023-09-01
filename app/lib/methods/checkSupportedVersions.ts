import { satisfies } from 'semver';
import moment from 'moment';

import { ISupportedVersions, TSVDictionary, TSVMessage, TSVStatus, TSVVersion } from '../../definitions';
import builtInSupportedVersions from '../../../app-supportedversions.json';

export const getMessage = ({
	messages,
	expiration
}: {
	messages?: TSVMessage[];
	expiration?: string;
}): TSVMessage | undefined => {
	if (!messages?.length || !expiration || moment(expiration).diff(new Date(), 'days') < 0) {
		return;
	}
	const sortedMessages = messages.sort((a, b) => a.remainingDays - b.remainingDays);
	return sortedMessages.find(({ remainingDays }) => moment(expiration).diff(new Date(), 'days') <= remainingDays);
};

const getStatus = ({ expiration, message }: { expiration?: string; message?: TSVMessage }): TSVStatus => {
	if (!(expiration && new Date(expiration) >= new Date())) {
		return 'expired';
	}
	if (message) {
		return 'warn';
	}
	return 'supported';
};

export const checkSupportedVersions = function ({
	supportedVersions,
	serverVersion
}: {
	supportedVersions?: ISupportedVersions;
	serverVersion: string;
}): {
	status: TSVStatus;
	message?: TSVMessage;
	i18n?: TSVDictionary;
} {
	// 1.2.3 -> ~1.2
	const serverVersionTilde = `~${serverVersion.split('.').slice(0, 2).join('.')}`;

	// Built-in suported versions
	if (!supportedVersions || supportedVersions.timestamp < builtInSupportedVersions.timestamp) {
		const versionInfo = builtInSupportedVersions.versions.find(({ version }) =>
			satisfies(version, serverVersionTilde)
		) as TSVVersion;
		const messages = versionInfo?.messages || (builtInSupportedVersions?.messages as TSVMessage[]);
		const message = getMessage({ messages, expiration: versionInfo?.expiration });
		return {
			status: getStatus({ expiration: versionInfo?.expiration, message }),
			message,
			i18n: message ? builtInSupportedVersions?.i18n : undefined
		};
	}

	// Backend/Cloud
	const versionInfo = supportedVersions.versions.find(({ version }) => satisfies(version, serverVersionTilde));
	if (versionInfo && new Date(versionInfo.expiration) >= new Date()) {
		const messages = versionInfo?.messages || supportedVersions?.messages;
		const message = getMessage({ messages, expiration: versionInfo.expiration });
		return {
			status: getStatus({ expiration: versionInfo?.expiration, message }),
			message,
			i18n: message ? supportedVersions?.i18n : undefined
		};
	}

	// Exceptions
	const exception = supportedVersions.exceptions?.versions.find(({ version }) => satisfies(version, serverVersionTilde));
	const messages =
		exception?.messages || supportedVersions.exceptions?.messages || versionInfo?.messages || supportedVersions.messages;
	const message = getMessage({ messages, expiration: exception?.expiration });
	return {
		status: getStatus({ expiration: exception?.expiration, message }),
		message,
		i18n: message ? supportedVersions?.i18n : undefined
	};
};
