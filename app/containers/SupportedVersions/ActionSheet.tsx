import React from 'react';
import moment from 'moment';

import { showActionSheetRef } from '../ActionSheet';
import { SupportedVersionsWarning, SupportedVersionsWarningSnaps } from './SupportedVersionsWarning';
import { getServerById } from '../../lib/database/services/Server';
import database from '../../lib/database';

export const showSupportedVersionsWarningActionSheet = async (server: string) => {
	const serverRecord = await getServerById(server);

	if (!serverRecord || moment(serverRecord?.supportedVersionsWarningAt).diff(new Date(), 'hours') <= 12) {
		return;
	}

	const serversDB = database.servers;
	await serversDB.write(async () => {
		await serverRecord.update(r => {
			r.supportedVersionsWarningAt = new Date();
		});
	});
	showActionSheetRef({ children: <SupportedVersionsWarning />, snaps: SupportedVersionsWarningSnaps });
};
