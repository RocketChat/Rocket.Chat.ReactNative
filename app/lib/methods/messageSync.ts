import { Q } from '@nozbe/watermelondb';

import database from '../database';
import log from './helpers/log';
import { messagesStatus } from '../constants/messagesStatus';
import { changeMessageStatus, resendMessage } from './sendMessage';
import { getSingleMessage as getSingleMessageService } from '../services/restApi';
import type { TMessageModel } from '../../definitions';

const TEMP_RECONCILIATION_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

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
				const result = await getSingleMessageService(record.id);
				if (result?.success && result.message) {
					await changeMessageStatus(
						record.id,
						messagesStatus.SENT,
						record.tmid ?? undefined,
						result.message
					);
					continue;
				}

				if (shouldResendAfterLookupFailure(result)) {
					try {
						await resendMessage(record, record.tmid ?? undefined);
					} catch (e) {
						log(e);
					}
					continue;
				}

				log(result);
			} catch (e) {
				if (shouldResendAfterLookupFailure(e)) {
					try {
						await resendMessage(record, record.tmid ?? undefined);
					} catch (resendError) {
						log(resendError);
					}
					continue;
				}

				log(e);
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
