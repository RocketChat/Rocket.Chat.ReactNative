import { createDirectMessage as createDirectMessageRest } from '../services/restApi';
import { createDirectMessageSubscriptionStub } from './createDirectMessageSubscriptionStub';

export const createDirectMessage = async (username: string) => {
	const result = await createDirectMessageRest(username);
	if (result?.success && result.room?._id) {
		await createDirectMessageSubscriptionStub({
			rid: result.room._id,
			username,
			fname: (result.room as any)?.fname
		});
	}
	return result;
};
