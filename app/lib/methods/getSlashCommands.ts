import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import database from '../database';
import log from './helpers/log';
import protectedFunction from './helpers/protectedFunction';
import { ISlashCommandResult, TSlashCommandModel } from '../../definitions';
import sdk from '../services/sdk';

export function getSlashCommands() {
	const db = database.active;
	return new Promise<void>(async resolve => {
		try {
			// RC 0.60.2
			// @ts-ignore
			const result = await sdk.get('commands.list');

			if (!result.success) {
				return resolve();
			}
			// @ts-ignore
			const { commands } = result;
			if (commands && commands.length) {
				await db.write(async () => {
					const slashCommandsCollection = db.get('slash_commands');
					const allSlashCommandsRecords = await slashCommandsCollection.query().fetch();

					// filter slash commands
					const filteredSlashCommandsToCreate = commands.filter(
						(i1: ISlashCommandResult) => !allSlashCommandsRecords.find(i2 => i1.command === i2.id)
					);
					const filteredSlashCommandsToUpdate = allSlashCommandsRecords.filter(i1 =>
						commands.find((i2: ISlashCommandResult) => i1.id === i2.command)
					);
					const filteredSlashCommandsToDelete = allSlashCommandsRecords.filter(
						i1 =>
							!filteredSlashCommandsToCreate.find((i2: ISlashCommandResult) => i2.command === i1.id) &&
							!filteredSlashCommandsToUpdate.find(i2 => i2.id === i1.id)
					);

					// Create
					const slashCommandsToCreate = filteredSlashCommandsToCreate.map((command: ISlashCommandResult) =>
						slashCommandsCollection.prepareCreate(
							protectedFunction((s: TSlashCommandModel) => {
								s._raw = sanitizedRaw({ id: command.command }, slashCommandsCollection.schema);
								Object.assign(s, command);
							})
						)
					);

					// Update
					const slashCommandsToUpdate = filteredSlashCommandsToUpdate.map(command => {
						const newCommand = commands.find((s: ISlashCommandResult) => s.command === command.id);
						return command.prepareUpdate(
							protectedFunction((s: TSlashCommandModel) => {
								Object.assign(s, newCommand);
							})
						);
					});

					// Delete
					const slashCommandsToDelete = filteredSlashCommandsToDelete.map(command => command.prepareDestroyPermanently());

					const allRecords = [...slashCommandsToCreate, ...slashCommandsToUpdate, ...slashCommandsToDelete];

					try {
						await db.batch(allRecords);
					} catch (e) {
						log(e);
					}
					return allRecords.length;
				});
			}
			return resolve();
		} catch (e) {
			log(e);
			return resolve();
		}
	});
}
