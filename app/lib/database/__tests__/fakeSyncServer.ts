/**
 * In-memory fake of the `chat.syncMessages` (>=7.1) cursor API, generalized from
 * `app/lib/methods/loadMissedMessages.test.ts` so every sync-integration test can
 * share one server. `sdk` stays the only mock — this drives `sdk.get`.
 *
 * The real endpoint answers two cursors keyed by `type`: UPDATED (created/edited)
 * and DELETED. Both paginate by `_updatedAt`, returning records strictly newer
 * than the requested `next` cursor, page by page, and succeed on an empty page.
 */

export interface IFakeServerMessage {
	_id: string;
	rid: string;
	msg: string;
	ts: string;
	_updatedAt: number;
}

/** As sent over the wire: the server serializes `_updatedAt` to an ISO string. */
export type TFakeServerMessageWire = Omit<IFakeServerMessage, '_updatedAt'> & { _updatedAt: string };

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
	deleted: IFakeServerMessage[];
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
			deleted?: TFakeServerMessageWire[];
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

export const createFakeSyncServer = (options: IFakeSyncServerOptions = {}): IFakeSyncServer => {
	const updatedPageSize = options.updatedPageSize ?? Number.POSITIVE_INFINITY;
	const deletedPageSize = options.deletedPageSize ?? Number.POSITIVE_INFINITY;

	let updatedPageRequests = 0;
	let deletedPageRequests = 0;

	const paginate = (source: IFakeServerMessage[], next: number | null | undefined, pageSize: number) => {
		const cursor = next ?? 0;
		const matching = source.filter(message => message._updatedAt > cursor).sort((a, b) => a._updatedAt - b._updatedAt);
		const page = matching.slice(0, pageSize);
		const nextCursor = matching.length > page.length ? page[page.length - 1]._updatedAt : null;
		return { page: page.map(serialize), nextCursor };
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
				const { page, nextCursor } = paginate(server.deleted, params.next, deletedPageSize);
				return { result: { deleted: page, cursor: { next: nextCursor, previous: null } } };
			}

			updatedPageRequests += 1;
			if (server.failUpdatedPageAtRequest && updatedPageRequests === server.failUpdatedPageAtRequest) {
				throw new Error('UPDATED page request failed');
			}
			const { page, nextCursor } = paginate(server.updated, params.next, updatedPageSize);
			return { result: { updated: page, cursor: { next: nextCursor, previous: null } } };
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
