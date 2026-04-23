import React, { useContext, useMemo, useState } from 'react';
import { StyleSheet, Text, type TextStyle } from 'react-native';
import { type Spoiler as SpoilerProps } from '@rocket.chat/message-parser';

import { Bold, Italic, Link, Strike } from './index';
import Plain from '../Plain';
import InlineCode from '../InlineCode';
import Image from '../Image';
import MarkdownContext from '../../contexts/MarkdownContext';
import Timestamp from '../Timestamp';
import { AtMention, Hashtag } from '../mentions';
import { Emoji } from '../emoji';
import sharedStyles from '../../../../views/Styles';
import { themes } from '../../../../lib/constants/colors';
import { useTheme } from '../../../../theme';

interface ISpoilerProps {
	value: SpoilerProps['value'];
}

interface ISpoilerContext {
	isRevealed: boolean;
	spoilerStyle?: TextStyle;
}

const SpoilerContext = React.createContext<ISpoilerContext>({
	isRevealed: true,
	spoilerStyle: undefined
});

const styles = StyleSheet.create({
	spoilerText: {
		...sharedStyles.textRegular
	},
	hidden: {}
});

const Spoiler = ({ value }: ISpoilerProps) => {
	const [isRevealed, setIsRevealed] = useState(false);
	const { useRealName, username, navToRoomInfo, mentions, channels } = useContext(MarkdownContext);
	const { theme } = useTheme();

	const hiddenStyle = useMemo(
		() =>
			isRevealed
				? undefined
				: {
						backgroundColor: themes[theme].surfaceNeutral,
						color: themes[theme].surfaceNeutral
					},
		[isRevealed, theme]
	);

	const contextValue = useMemo(
		() => ({
			isRevealed,
			spoilerStyle: hiddenStyle
		}),
		[isRevealed, hiddenStyle]
	);

	const handleToggle = () => {
		// if (isRevealed) {
		// 	return;
		// }
		setIsRevealed(!isRevealed);
	};

	return (
		<SpoilerContext.Provider value={contextValue}>
			<Text style={styles.spoilerText} onPress={handleToggle}>
				{value.map((block, index) => {
					switch (block.type) {
						case 'PLAIN_TEXT':
							return <Plain key={index} value={block.value} />;
						case 'BOLD':
							return <Bold key={index} value={block.value} />;
						case 'ITALIC':
							return <Italic key={index} value={block.value} />;
						case 'STRIKE':
							return <Strike key={index} value={block.value} />;
						case 'LINK':
							return <Link key={index} value={block.value} disabled={!isRevealed} />;
						case 'INLINE_CODE':
							return <InlineCode key={index} value={block.value} />;
						case 'IMAGE':
							return <Image key={index} value={block.value} />;
						case 'TIMESTAMP':
							return <Timestamp key={index} value={block.value} />;
						case 'MENTION_USER':
							return (
								<AtMention
									key={index}
									mention={block.value.value}
									useRealName={useRealName}
									username={username}
									navToRoomInfo={navToRoomInfo}
									mentions={mentions}
									disabled={!isRevealed}
								/>
							);
						case 'MENTION_CHANNEL':
							return (
								<Hashtag
									key={index}
									hashtag={block.value.value}
									navToRoomInfo={navToRoomInfo}
									channels={channels}
									disabled={!isRevealed}
								/>
							);
						case 'EMOJI':
							return <Emoji key={index} block={block} index={index} />;
						case 'INLINE_KATEX':
							return <Text key={index}>{block.value}</Text>;
						default:
							return null;
					}
				})}
			</Text>
		</SpoilerContext.Provider>
	);
};

export default Spoiler;
export { SpoilerContext };
