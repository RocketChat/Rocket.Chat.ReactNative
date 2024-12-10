import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { Q } from '@nozbe/watermelondb';

import { IAppActionButton, TAppActionButtonModel } from '../../definitions';
import database from '../database';
import sdk from '../services/sdk';
import { store as reduxStore } from '../store/auxStore';
import protectedFunction from './helpers/protectedFunction';
import { removeAppActionButtonsByAppId, setAppActionButtons as setAppActionButtonsAction } from '../../actions/appActionButtons';
import log from './helpers/log';

export const getAppActionButtonId = (action: IAppActionButton) => `${action.appId}/${action.actionId}`;

export async function setAppActionButtons(): Promise<void> {
	const db = database.active;
	const appActionButtonsCollection = db.get('app_actions_buttons');

	const allAppActionButtons = (await appActionButtonsCollection.query().fetch()).map(i => i.asPlain());
	const parsed = allAppActionButtons.reduce((acc, item) => ({ ...acc, [getAppActionButtonId(item)]: item }), {});

	reduxStore.dispatch(setAppActionButtonsAction(parsed));
}

type IAppsChanged = {
	fields: {
		eventName: string;
		args: any;
	};
};

export async function onAppsChanged(ddpMessage: IAppsChanged) {
	const { eventName, args } = ddpMessage.fields;

	if (/app\/removed/.test(eventName)) {
		const appId = args[0];
		const db = database.active;
		try {
			const dbCollection = db.get('app_actions_buttons');
			const appRecords = await dbCollection.query(Q.where('app_id', appId)).fetch();
			if (appRecords) {
				await db.write(async () => {
					await Promise.all(appRecords.map(app => app.destroyPermanently()));
				});
				reduxStore.dispatch(removeAppActionButtonsByAppId(appId));
			}
		} catch (e) {
			log(e);
		}
	}

	if (/app\/added|actions\/changed|app\/statusUpdate|app\/updated/.test(eventName)) {
		try {
			await getAppActions();
		} catch (e) {
			log(e);
		}
	}
}

export const getAppActions = () => {
	const db = database.active;

	return new Promise<void>(async resolve => {
		try {
			const appActionButtons = (await sdk.get('actionButtons', undefined, 'apps')) as unknown as IAppActionButton[];

			if (appActionButtons && appActionButtons.length) {
				await db.write(async () => {
					const appActionButtonsCollection = db.get('app_actions_buttons');
					const allAppActionButtonsRecords = await appActionButtonsCollection.query().fetch();

					const filteredAppActionButtonsToCreate = appActionButtons.filter(
						(i1: IAppActionButton) =>
							!allAppActionButtonsRecords.find(i2 => getAppActionButtonId(i1) === getAppActionButtonId(i2))
					);

					const filteredAppActionButtonsToUpdate = allAppActionButtonsRecords.filter(i1 =>
						appActionButtons.find((i2: IAppActionButton) => getAppActionButtonId(i1) === getAppActionButtonId(i2))
					);

					const filteredAppActionButtonsToDelete = allAppActionButtonsRecords.filter(
						i1 =>
							!filteredAppActionButtonsToCreate.find(
								(i2: IAppActionButton) => getAppActionButtonId(i1) === getAppActionButtonId(i2)
							) && !filteredAppActionButtonsToUpdate.find(i2 => getAppActionButtonId(i1) === getAppActionButtonId(i2))
					);

					const appActionButtonsToCreate = filteredAppActionButtonsToCreate.map((action: IAppActionButton) =>
						appActionButtonsCollection.prepareCreate(
							protectedFunction((s: TAppActionButtonModel) => {
								s._raw = sanitizedRaw({ id: getAppActionButtonId(action) }, appActionButtonsCollection.schema);
								Object.assign(s, action);
							})
						)
					);

					const appActionButtonsToUpdate = filteredAppActionButtonsToUpdate.map(action => {
						const newAction = appActionButtons.find(
							(s: IAppActionButton) => getAppActionButtonId(s) === getAppActionButtonId(action)
						);
						return action.prepareUpdate(
							protectedFunction((s: TAppActionButtonModel) => {
								Object.assign(s, newAction);
							})
						);
					});

					const appActionButtonsToDelete = filteredAppActionButtonsToDelete.map(action => action.prepareDestroyPermanently());

					const allRecords = [...appActionButtonsToCreate, ...appActionButtonsToUpdate, ...appActionButtonsToDelete];

					try {
						await db.batch(allRecords);
					} catch (e) {
						log(e);
					}
					setAppActionButtons();
					return allRecords.length;
				});
			}

			return resolve();
		} catch (e) {
			log(e);
			return resolve();
		}
	});
};
