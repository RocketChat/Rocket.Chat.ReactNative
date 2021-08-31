import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import reduxStore from '../createStore';
import RocketChat from '../rocketchat';
import database from '../database';
import protectedFunction from './helpers/protectedFunction';
import log from '../../utils/log';

export function getCannedResponses() {
	return new Promise(async(resolve) => {
		const { settings, permissions } = reduxStore.getState();

		const { Canned_Responses_Enable } = settings;

		if (!Canned_Responses_Enable) {
			return resolve();
		}

		const viewCannedResponses = permissions['view-canned-responses'];
		const permission = await RocketChat.hasPermission([viewCannedResponses]);

		if (!permission[0]) {
			return resolve();
		}

		try {
			const result = await this.sdk.get('canned-responses.get');

			if (!result.success) {
				return resolve();
			}

			const { responses } = result;

			if (responses && responses.length) {
				const db = database.active;

				await db.action(async() => {
					const cannedResponsesCollection = db.get('canned_responses');
					const allCannedResponsesRecords = await cannedResponsesCollection.query().fetch();

					// filter canned responses
					let cannedResponsesToCreate = responses.filter(resAPI => !allCannedResponsesRecords.find(resDB => resAPI.shortcut === resDB.id));
					let cannedResponsesToUpdate = allCannedResponsesRecords.filter(resDB => responses.find(resAPI => resAPI.shortcut === resDB.id));
					let cannedResponsesToDelete = allCannedResponsesRecords.filter(resDB => (!cannedResponsesToCreate.find(resNEW => resNEW.shortcut === resDB.id) && !cannedResponsesToUpdate.find(resUP => resUP.id === resDB.id)));

					// Create and use the shortcut value as ID in our local db
					cannedResponsesToCreate = cannedResponsesToCreate.map(cannedResponse => cannedResponsesCollection.prepareCreate(protectedFunction((s) => {
						s._raw = sanitizedRaw({ id: cannedResponse.shortcut }, cannedResponsesCollection.schema);
						Object.assign(s, cannedResponse);
					})));

					// Update canned responses
					cannedResponsesToUpdate = cannedResponsesToUpdate.map((cannedResponse) => {
						const responseToUpdate = responses.find(s => s.shortcut === cannedResponse.id);
						return cannedResponse.prepareUpdate(protectedFunction((s) => {
							Object.assign(s, responseToUpdate);
						}));
					});

					// Delete
					cannedResponsesToDelete = cannedResponsesToDelete.map(cannedResponse => cannedResponse.prepareDestroyPermanently());

					const allRecords = [
						...cannedResponsesToCreate,
						...cannedResponsesToUpdate,
						...cannedResponsesToDelete
					];
					try {
						await db.batch(...allRecords);
					} catch (e) {
						log(e);
					}

					return allRecords.length;
				});
			}
		} catch (e) {
			return resolve();
		}
	});
}
