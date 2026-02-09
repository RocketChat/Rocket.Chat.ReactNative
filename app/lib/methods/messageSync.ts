import { Q } from '@nozbe/watermelondb';

import database from '../database';
import log from './helpers/log';
import { messagesStatus } from '../constants/messagesStatus';
import { changeMessageStatus, resendMessage } from './sendMessage';
import { getSingleMessage as getSingleMessageService } from '../services/restApi';
import type { TMessageModel } from '../../definitions';

const TEMP_RECONCILIATION_THRESHOLD_MS = 5 * 60 * 1000;

const hasMessageNotFoundHint = (value?: string): boolean =>
	/message[\s_-]*not[\s_-]*found|error-message-not-found/i.test(value ?? '');

const shouldResendAfterLookupFailure = (error: unknown): boolean => {
	if (!error) {
		return false;
	}

	if (typeof error === 'string') {
		return hasMessageNotFoundHint(error);
	}

	if (error instanceof Error) {
		return hasMessageNotFoundHint(error.message);
	}

	const err = error as {
		message?: string;
		error?: string;
		reason?: string;
		data?: { message?: string; error?: string; errorType?: string };
	};

	return (
		hasMessageNotFoundHint(err.message) ||
		hasMessageNotFoundHint(err.error) ||
		hasMessageNotFoundHint(err.reason) ||
		hasMessageNotFoundHint(err.data?.message) ||
		hasMessageNotFoundHint(err.data?.error) ||
		hasMessageNotFoundHint(err.data?.errorType)
	);
};

const processSequentially = <T>(items: T[], processItem: (item: T) => Promise<void>) =>
	items.reduce<Promise<void>>(async (previous, item) => {
		await previous;
		await processItem(item);
	}, Promise.resolve());

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
		await processSequentially(tempMessages as TMessageModel[], async record => {
			try {
				const result = await getSingleMessageService(record.id);
				if (result?.success && result.message) {
					await changeMessageStatus(
						record.id,
						messagesStatus.SENT,
						record.tmid ?? undefined,
						result.message
					);
					return;
				}

				if (shouldResendAfterLookupFailure(result)) {
					try {
						await resendMessage(record, record.tmid ?? undefined);
					} catch (e) {
						log(e);
					}
					return;
				}

				log(result);
			} catch (e) {
				if (shouldResendAfterLookupFailure(e)) {
					try {
						await resendMessage(record, record.tmid ?? undefined);
					} catch (resendError) {
						log(resendError);
					}
					return;
				}

				log(e);
			}
		});
	} catch (e) {
		log(e);
	}
}

export async function retryErrorMessages(): Promise<void> {
	const db = database.active;
	if (!db) {
		return;
	}

	const msgCollection = db.get('messages');

	try {
		const errorMessages = await msgCollection.query(Q.where('status', messagesStatus.ERROR)).fetch();
		await processSequentially(errorMessages as TMessageModel[], async record => {
			try {
				await resendMessage(record, record.tmid ?? undefined);
			} catch (e) {
				log(e);
			}
		});
	} catch (e) {
		log(e);
	}
}
