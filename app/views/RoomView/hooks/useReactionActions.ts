import log from '../../../lib/methods/helpers/log';
import { Review } from '../../../lib/methods/helpers/review';
import { getEmojiContent } from '../../../lib/methods/emojis';
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
	const resetAction = () => {
		messageActionStore.getState().actions.clear();
	};

	const onReactionClose = () => {
		resetAction();
		hideActionSheet();
	};

	const onReactionPress = async (emoji: IEmoji, messageId: string) => {
		try {
			await setReaction(getEmojiContent(emoji), messageId);
			onReactionClose();
			Review.pushPositiveEvent();
		} catch (e) {
			log(e);
		}
	};

	return { resetAction, onReactionClose, onReactionPress };
}
