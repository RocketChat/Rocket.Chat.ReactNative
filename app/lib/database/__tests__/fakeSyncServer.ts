/**
 * In-memory fake of the `chat.syncMessages` (>=7.1) cursor API, generalized from
 * `app/lib/methods/loadMissedMessages.test.ts` so every sync-integration test can
 * share one server. `sdk` stays the only mock — this drives `sdk.get`.
 *
 * The real endpoint answers two independent cursors keyed by `type`: UPDATED
 * (created/edited) paginates by `_updatedAt`, DELETED by `_deletedAt`. Both return
 * records strictly newer than the requested `next` cursor, page by page, and succeed
 * on an empty page. Deleted records are projected down to `{ _id, _deletedAt }`, so
 * they carry no message body and no `_updatedAt`.
 */

export interface IFakeServerMessage {
	_id: string;
	rid: string;
	msg: string;
	ts: string;
	_updatedAt: number;
}

export interface IFakeServerDeletedMessage {
	_id: string;
	_deletedAt: number;
	/**
	 * Not part of the real projection. Only for tests proving the client ignores an
	 * overstated deleted payload rather than feeding it to the sync cursor.
	 */
	_updatedAt?: number;
}

/** As sent over the wire: the server serializes `_updatedAt` to an ISO string. */
export type TFakeServerMessageWire = Omit<IFakeServerMessage, '_updatedAt'> & { _updatedAt: string };

/** As sent over the wire: `{ _id, _deletedAt }`, both timestamps ISO strings. */
export type TFakeServerDeletedWire = { _id: string; _deletedAt: string; _updatedAt?: string };

export interface IFakeSyncServerOptions {
	updatedPageSize?: number;
	deletedPageSize?: number;
}

/** Structural shape of an `sdk.get` jest mock — avoids depending on the `jest` global type here. */
type TSdkGetMock = {
	mockImplementation: (fn: (endpoint: string, params: { type?: string; next?: number | null }) => unknown) => void;
};

export interface IFakeSyncServer {
	updated: IFakeServerMessage[];
	deleted: IFakeServerDeletedMessage[];
	/** Reject the Nth UPDATED page request (1-based) to model a mid-pagination network error. */
	failUpdatedPageAtRequest: number | null;
	/** Reject the Nth DELETED page request (1-based). */
	failDeletedPageAtRequest: number | null;
	/** Clears messages, cursors, counters and failure injection — call in `beforeEach`. */
	reset(): void;
	/** Answers a single `chat.syncMessages` request the way the >=7.1 API does. */
	handleSyncMessages(params: { type?: string; next?: number | null }): {
		result: {
			updated?: TFakeServerMessageWire[];
			deleted?: TFakeServerDeletedWire[];
			cursor: { next: number | null; previous: number | null };
		};
	};
	/** Wires this server into an `sdk.get` jest mock; throws on any other endpoint. */
	installOn(sdkGet: TSdkGetMock): void;
}

const serialize = (message: IFakeServerMessage): TFakeServerMessageWire => ({
	...message,
	_updatedAt: new Date(message._updatedAt).toISOString()
});

const serializeDeleted = (message: IFakeServerDeletedMessage): TFakeServerDeletedWire => ({
	_id: message._id,
	_deletedAt: new Date(message._deletedAt).toISOString(),
	...(message._updatedAt !== undefined && { _updatedAt: new Date(message._updatedAt).toISOString() })
});

export const createFakeSyncServer = (options: IFakeSyncServerOptions = {}): IFakeSyncServer => {
	const updatedPageSize = options.updatedPageSize ?? Number.POSITIVE_INFINITY;
	const deletedPageSize = options.deletedPageSize ?? Number.POSITIVE_INFINITY;

	let updatedPageRequests = 0;
	let deletedPageRequests = 0;

	const paginate = <T>(source: T[], next: number | null | undefined, pageSize: number, sortKey: (message: T) => number) => {
		const cursor = next ?? 0;
		const matching = source.filter(message => sortKey(message) > cursor).sort((a, b) => sortKey(a) - sortKey(b));
		const page = matching.slice(0, pageSize);
		const nextCursor = matching.length > page.length ? sortKey(page[page.length - 1]) : null;
		return { page, nextCursor };
	};

	const server: IFakeSyncServer = {
		updated: [],
		deleted: [],
		failUpdatedPageAtRequest: null,
		failDeletedPageAtRequest: null,

		reset() {
			server.updated.length = 0;
			server.deleted.length = 0;
			server.failUpdatedPageAtRequest = null;
			server.failDeletedPageAtRequest = null;
			updatedPageRequests = 0;
			deletedPageRequests = 0;
		},

		handleSyncMessages(params) {
			if (params.type === 'DELETED') {
				deletedPageRequests += 1;
				if (server.failDeletedPageAtRequest && deletedPageRequests === server.failDeletedPageAtRequest) {
					throw new Error('DELETED page request failed');
				}
				const { page, nextCursor } = paginate(server.deleted, params.next, deletedPageSize, message => message._deletedAt);
				return { result: { deleted: page.map(serializeDeleted), cursor: { next: nextCursor, previous: null } } };
			}

			updatedPageRequests += 1;
			if (server.failUpdatedPageAtRequest && updatedPageRequests === server.failUpdatedPageAtRequest) {
				throw new Error('UPDATED page request failed');
			}
			const { page, nextCursor } = paginate(server.updated, params.next, updatedPageSize, message => message._updatedAt);
			return { result: { updated: page.map(serialize), cursor: { next: nextCursor, previous: null } } };
		},

		installOn(sdkGet) {
			sdkGet.mockImplementation((endpoint: string, params: { type?: string; next?: number | null }) => {
				if (endpoint === 'chat.syncMessages') {
					return Promise.resolve(server.handleSyncMessages(params));
				}
				throw new Error(`Unexpected endpoint ${endpoint}`);
			});
		}
	};

	return server;
};
