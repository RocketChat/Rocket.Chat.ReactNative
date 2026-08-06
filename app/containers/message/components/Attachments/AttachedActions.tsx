import Button from '../../../Button';
import { useOnAnswerButtonPress } from '../../stores/MessageRoomStore';
import { type IAttachment } from '../../../../definitions';
import openLink from '../../../../lib/methods/helpers/openLink';
import Markdown from '../../../markdown';

export type TElement = {
	type: string;
	msg?: string;
	url?: string;
	text: string;
};

const AttachedActions = ({ attachment }: { attachment: IAttachment }) => {
	const onAnswerButtonPress = useOnAnswerButtonPress();

	if (!attachment.actions) {
		return null;
	}

	const attachedButtons = attachment.actions.map((element: TElement) => {
		const onPress = () => {
			if (element.msg) {
				onAnswerButtonPress?.(element.msg, false);
			}

			if (element.url) {
				openLink(element.url);
			}
		};

		if (element.type === 'button') {
			return <Button onPress={onPress} title={element.text} />;
		}

		return null;
	});
	return (
		<>
			<Markdown msg={attachment.text} />
			{attachedButtons}
		</>
	);
};
export default AttachedActions;
