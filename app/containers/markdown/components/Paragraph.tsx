import React, { useContext, useState } from 'react';
import { Text, View } from 'react-native';
import { Inlines, Paragraph as ParagraphProps } from '@rocket.chat/message-parser';

import Inline from './Inline';
import styles from '../styles';
import { useTheme } from '../../../theme';
import { themes } from '../../../lib/constants';
import MarkdownContext from '../contexts/MarkdownContext';
import { IUserMention, IUserChannel } from '../interfaces';

interface IParagraphProps {
	value: ParagraphProps['value'];
}

const Paragraph = ({ value }: IParagraphProps) => {
	let forceTrim = false;
	const { theme } = useTheme();
	const { useRealName, username, navToRoomInfo, mentions, channels } = useContext(MarkdownContext);
	

	if (
		value?.[0]?.type === 'LINK' &&
		// Need to update the @rocket.chat/message-parser to understand that the label can be a Markup | Markup[]
		// https://github.com/RocketChat/fuselage/blob/461ecf661d9ff4a46390957c915e4352fa942a7c/packages/message-parser/src/definitions.ts#L141
		// @ts-ignore
		(value?.[0]?.value?.label?.value?.toString().trim() === '' || value?.[0]?.value?.label?.[0]?.value?.toString().trim() === '')
	) {
		// We are returning null when we receive a message like this: `[ ](https://open.rocket.chat/)\nplain_text`
		// to avoid render a line empty above the the message
		if (value.length === 1) {
			return null;
		}
		if (value.length === 2 && value?.[1]?.type === 'PLAIN_TEXT' && value?.[1]?.value?.toString().trim() === '') {
			return null;
		}
		forceTrim = true;
	}
	return (
		<Text style={{ color: themes[theme].fontDefault }}>
			{value.map((block, index) => {
				// We are forcing trim when is a `[ ](https://https://open.rocket.chat/) plain_text`
				// to clean the empty spaces
				if (forceTrim) {
					if (index === 0 && block.type === 'LINK') {
						if (!Array.isArray(block.value.label)) {
							block.value.label.value = block.value?.label?.value?.toString().trimLeft();
						} else {
							// @ts-ignore - we are forcing the value to be a string
							block.value.label.value = block?.value?.label?.[0]?.value?.toString().trimLeft();
						}
					}
					if (index === 1 && block.type !== 'LINK') {
						block.value = block.value?.toString().trimLeft();
					}
				}

				return <Line index={index} block={block} useRealName={useRealName} username={username} navToRoomInfo={navToRoomInfo} mentions={mentions} channels={channels} />;
			})}
		</Text>
	);
};

export default Paragraph;

function Line(props: {index: number, block: Inlines, useRealName: boolean | undefined, username: string | undefined, navToRoomInfo: Function | undefined, mentions: IUserMention[] | undefined, channels: IUserChannel[] | undefined }): React.JSX.Element {
	const [lineHeight, setLineHeight] = useState(styles.text.lineHeight)
	return <View style={{ flexDirection: 'row', flexWrap: 'wrap',minHeight: lineHeight }} key={props.index}>
		<Inline block={props.block} useRealName={props.useRealName} username={props.username} navToRoomInfo={props.navToRoomInfo} mentions={props.mentions} channels={props.channels} onHeightChange={setLineHeight} />
	</View>;
}

