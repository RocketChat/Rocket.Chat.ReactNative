import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import database from '../database';
import { type TAppDatabase } from '../database/interfaces';
import protectedFunction from './helpers/protectedFunction';
import { type ISlashCommandResult, type TSlashCommandModel } from '~/definitions/ISlashCommand';
import sdk from '../services/sdk';

const EVERY_COMMAND_THE_SERVER_ALLOWS = 0;
const SORTED_BY_COMMAND = JSON.stringify({ command: 1 });

const saveSlashCommands = async (db: TAppDatabase, commands: ISlashCommandResult[]) => {
	const commandsById = new Map(commands.map(command => [command.command, command]));
	await db.write(async () => {
		const slashCommandsCollection = db.get('slash_commands');
		const storedRecords = await slashCommandsCollection.query().fetch();
		const storedIds = new Set(storedRecords.map(record => record.id));

		const recordsToCreate = [...commandsById.values()]
			.filter(command => !storedIds.has(command.command))
			.map(command =>
				slashCommandsCollection.prepareCreate(
					protectedFunction((record: TSlashCommandModel) => {
						record._raw = sanitizedRaw({ id: command.command }, slashCommandsCollection.schema);
						Object.assign(record, command);
					})
				)
			);

		const recordsToUpdateOrDelete = storedRecords.map(record => {
			const command = commandsById.get(record.id);
			if (!command) {
				return record.prepareDestroyPermanently();
			}
			return record.prepareUpdate(
				protectedFunction((updated: TSlashCommandModel) => {
					Object.assign(updated, command);
				})
			);
		});

		await db.batch([...recordsToCreate, ...recordsToUpdateOrDelete]);
	});
};

export async function getSlashCommands() {
	const db = database.active;
	const commands: ISlashCommandResult[] = [];
	let total = Infinity;
	while (commands.length < total) {
		if (database.active !== db) {
			return;
		}
		const page = await sdk.get('commands.list', {
			offset: commands.length,
			count: EVERY_COMMAND_THE_SERVER_ALLOWS,
			sort: SORTED_BY_COMMAND
		});
		if (!page.success || page.appsLoaded === false) {
			return;
		}
		if (!page.commands.length) {
			break;
		}
		commands.push(...page.commands);
		total = page.total;
	}
	await saveSlashCommands(db, commands);
}
