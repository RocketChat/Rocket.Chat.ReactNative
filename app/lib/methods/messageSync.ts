import { Q } from '@nozbe/watermelondb';

import database from '../database';
import log from './helpers/log';
import { messagesStatus } from '../constants/messagesStatus';
import { changeMessageStatus, resendMessage } from './sendMessage';
import getSingleMessage from './getSingleMessage';
import type { TMessageModel } from '../../definitions';

const TEMP_RECONCILIATION_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Reconciles stuck TEMP messages (e.g. after app crash/kill) on app restart.
 * For each TEMP message older than the threshold: if it exists on server, mark SENT; otherwise resend.
 */
export async function reconcileTempMessages(): Promise<void> {
	const db = database.active;
	if (!db) {
		return;
	}

	const msgCollection = db.get('messages');
	const threshold = Date.now() - TEMP_RECONCILIATION_THRESHOLD_MS;

	try {
		const tempMessages = await msgCollection
			.query(Q.where('status', messagesStatus.TEMP), Q.where('ts', Q.lt(threshold)))
			.fetch();

		// Process one-by-one so one failure does not stop the rest
		/* eslint-disable no-await-in-loop */
		for (const record of tempMessages as TMessageModel[]) {
			try {
				const serverMessage = await getSingleMessage(record.id);
				if (serverMessage) {
					await changeMessageStatus(
						record.id,
						messagesStatus.SENT,
						record.tmid ?? undefined,
						serverMessage
					);
				}
			} catch {
				try {
					await resendMessage(record, record.tmid ?? undefined);
				} catch (e) {
					log(e);
				}
			}
		}
		/* eslint-enable no-await-in-loop */
	} catch (e) {
		log(e);
	}
}

/**
 * Retries all ERROR messages (e.g. after network reconnection).
 */
export async function retryErrorMessages(): Promise<void> {
	const db = database.active;
	if (!db) {
		return;
	}

	const msgCollection = db.get('messages');

	try {
		const errorMessages = await msgCollection.query(Q.where('status', messagesStatus.ERROR)).fetch();

		// Process one-by-one so one failure does not stop the rest
		/* eslint-disable no-await-in-loop */
		for (const record of errorMessages as TMessageModel[]) {
			try {
				await resendMessage(record, record.tmid ?? undefined);
			} catch (e) {
				log(e);
			}
		}
		/* eslint-enable no-await-in-loop */
	} catch (e) {
		log(e);
	}
}
