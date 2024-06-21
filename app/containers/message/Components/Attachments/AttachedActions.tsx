import React, { useContext } from 'react';

import Button from '../../../Button';
import MessageContext from '../../Context';
import { IAttachment, TGetCustomEmoji } from '../../../../definitions';
import openLink from '../../../../lib/methods/helpers/openLink';
import Markdown from '../../../markdown';

export type TElement = {
	type: string;
	msg?: string;
	url?: string;
	text: string;
};

const AttachedActions = ({ attachment, getCustomEmoji }: { attachment: IAttachment; getCustomEmoji: TGetCustomEmoji }) => {
	const { onAnswerButtonPress } = useContext(MessageContext);

	if (!attachment.actions) {
		return null;
	}

	const attachedButtons = attachment.actions.map((element: TElement) => {
		const onPress = () => {
			if (element.msg) {
				onAnswerButtonPress(element.msg);
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
			<Markdown msg={attachment.text} getCustomEmoji={getCustomEmoji} />
			{attachedButtons}
		</>
	);
};
export default AttachedActions;
