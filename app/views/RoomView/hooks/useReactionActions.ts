import log from '../../../lib/methods/helpers/log';
import { Review } from '../../../lib/methods/helpers/review';
import { setReaction } from '../../../lib/services/restApi';
import { type IEmoji } from '../../../definitions';
import { type TMessageActionStore } from '../../../containers/message/stores/MessageActionStore';

interface IUseReactionActionsParams {
	messageActionStore: TMessageActionStore;
	hideActionSheet: () => void;
}

export interface IUseReactionActionsResult {
	resetAction: () => void;
	onReactionClose: () => void;
	onReactionPress: (emoji: IEmoji, messageId: string) => Promise<void>;
}

export function useReactionActions({
	messageActionStore,
	hideActionSheet
}: IUseReactionActionsParams): IUseReactionActionsResult {
	'use memo';

	const resetAction = () => {
		messageActionStore.getState().actions.clear();
	};

	const onReactionClose = () => {
		resetAction();
		hideActionSheet();
	};

	const onReactionPress = async (emoji: IEmoji, messageId: string) => {
		try {
			let shortname = '';
			if (typeof emoji === 'string') {
				shortname = emoji;
			} else {
				shortname = emoji.name;
			}
			await setReaction(shortname, messageId);
			onReactionClose();
			Review.pushPositiveEvent();
		} catch (e) {
			log(e);
		}
	};

	return { resetAction, onReactionClose, onReactionPress };
}
