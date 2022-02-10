import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import database from '../database';
import log from '../../utils/log';
import protectedFunction from './helpers/protectedFunction';
import { IRocketChat, ISlashCommandResponse, TSlashCommandModel } from '../../definitions';

export default function (this: IRocketChat) {
	const db = database.active;
	return new Promise<void>(async resolve => {
		try {
			// RC 0.60.2
			const result = await this.sdk.get('commands.list');

			if (!result.success) {
				console.log(result);
				return resolve();
			}

			const { commands } = result;
			if (commands && commands.length) {
				await db.write(async () => {
					const slashCommandsCollection = db.get('slash_commands');
					const allSlashCommandsRecords = await slashCommandsCollection.query().fetch();

					// filter slash commands
					let slashCommandsToCreate = commands.filter(
						(i1: ISlashCommandResponse) => !allSlashCommandsRecords.find(i2 => i1.command === i2.id)
					);
					let slashCommandsToUpdate = allSlashCommandsRecords.filter(i1 =>
						commands.find((i2: ISlashCommandResponse) => i1.id === i2.command)
					);
					let slashCommandsToDelete = allSlashCommandsRecords.filter(
						i1 =>
							!slashCommandsToCreate.find((i2: ISlashCommandResponse) => i2.command === i1.id) &&
							!slashCommandsToUpdate.find(i2 => i2.id === i1.id)
					);

					// Create
					slashCommandsToCreate = slashCommandsToCreate.map((command: ISlashCommandResponse) =>
						slashCommandsCollection.prepareCreate(
							protectedFunction((s: TSlashCommandModel) => {
								s._raw = sanitizedRaw({ id: command.command }, slashCommandsCollection.schema);
								Object.assign(s, command);
							})
						)
					);

					// Update
					slashCommandsToUpdate = slashCommandsToUpdate.map(command => {
						const newCommand = commands.find((s: ISlashCommandResponse) => s.command === command.id);
						return command.prepareUpdate(
							protectedFunction((s: TSlashCommandModel) => {
								Object.assign(s, newCommand);
							})
						);
					});

					// Delete
					slashCommandsToDelete = slashCommandsToDelete.map(command => command.prepareDestroyPermanently());

					const allRecords = [...slashCommandsToCreate, ...slashCommandsToUpdate, ...slashCommandsToDelete];

					try {
						await db.batch(...allRecords);
					} catch (e) {
						log(e);
					}
					return allRecords.length;
				});
			}
		} catch (e) {
			log(e);
			return resolve();
		}
	});
}
