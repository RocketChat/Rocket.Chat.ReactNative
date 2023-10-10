import moment from 'moment';
import coerce from 'semver/functions/coerce';

import { ISupportedVersionsData, TSVDictionary, TSVMessage, TSVStatus, TSVVersion } from '../../definitions';
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
	supportedVersions?: ISupportedVersionsData;
	serverVersion: string;
}): {
	status: TSVStatus;
	message?: TSVMessage;
	i18n?: TSVDictionary;
	expiration?: string;
} {
	// Built-in suported versions
	if (!supportedVersions || supportedVersions.timestamp < builtInSupportedVersions.timestamp) {
		const versionInfo = builtInSupportedVersions.versions.find(
			({ version }) => coerce(version)?.version === serverVersion
		) as TSVVersion;
		const messages = versionInfo?.messages || (builtInSupportedVersions?.messages as TSVMessage[]);
		const message = getMessage({ messages, expiration: versionInfo?.expiration });
		return {
			status: getStatus({ expiration: versionInfo?.expiration, message }),
			message,
			i18n: message ? builtInSupportedVersions?.i18n : undefined,
			expiration: versionInfo?.expiration
		};
	}

	// Backend/Cloud
	const versionInfo = supportedVersions.versions.find(({ version }) => coerce(version)?.version === serverVersion);
	if (versionInfo && new Date(versionInfo.expiration) >= new Date()) {
		const messages = versionInfo?.messages || supportedVersions?.messages;
		const message = getMessage({ messages, expiration: versionInfo.expiration });
		return {
			status: getStatus({ expiration: versionInfo?.expiration, message }),
			message,
			i18n: message ? supportedVersions?.i18n : undefined,
			expiration: versionInfo?.expiration
		};
	}

	// Exceptions
	const exception = supportedVersions.exceptions?.versions.find(({ version }) => coerce(version)?.version === serverVersion);
	const messages =
		exception?.messages || supportedVersions.exceptions?.messages || versionInfo?.messages || supportedVersions.messages;
	const message = getMessage({ messages, expiration: exception?.expiration });
	return {
		status: getStatus({ expiration: exception?.expiration, message }),
		message,
		i18n: message ? supportedVersions?.i18n : undefined,
		expiration: exception?.expiration
	};
};
