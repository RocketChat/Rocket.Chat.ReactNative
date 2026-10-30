import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import logger from '@nozbe/watermelondb/utils/common/logger';

import appSchema from '../database/schema/app';
import migrations from '../database/model/migrations';
import Subscription from '../database/model/Subscription';
import Room from '../database/model/Room';
import Message from '../database/model/Message';
import Thread from '../database/model/Thread';
import ThreadMessage from '../database/model/ThreadMessage';
import CustomEmoji from '../database/model/CustomEmoji';
import FrequentlyUsedEmoji from '../database/model/FrequentlyUsedEmoji';
import Upload from '../database/model/Upload';
import Setting from '../database/model/Setting';
import Role from '../database/model/Role';
import Permission from '../database/model/Permission';
import SlashCommand from '../database/model/SlashCommand';
import User from '../database/model/User';
import { type TAppDatabase } from '../database/interfaces';

logger.silence();

export const createInMemoryAppDatabase = (): TAppDatabase =>
	new Database({
		adapter: new LokiJSAdapter({
			schema: appSchema,
			migrations,
			useWebWorker: false,
			useIncrementalIndexedDB: false,
			dbName: `test-${Math.random()}`,
			extraLokiOptions: { autosave: false }
		}),
		modelClasses: [
			Subscription,
			Room,
			Message,
			Thread,
			ThreadMessage,
			CustomEmoji,
			FrequentlyUsedEmoji,
			Upload,
			Setting,
			Role,
			Permission,
			SlashCommand,
			User
		]
	}) as TAppDatabase;
