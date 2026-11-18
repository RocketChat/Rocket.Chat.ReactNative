import { memo, type ReactElement, type RefObject } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { type TMessageAction } from '~/definitions/IMessage';
import { type IComposerInput } from '../interfaces';
import { useTheme } from '~/theme';
import { RecordAudio } from './RecordAudio/RecordAudio';
import { Left } from './Unfocused/Left';
import { Right } from './Unfocused/Right';
import { MIN_HEIGHT } from '../constants';
import { SendThreadToChannel } from './SendThreadToChannel';
import { EmojiSearchbar } from './EmojiSearchbar';
import { Toolbar } from './Toolbar/Toolbar';
import { Quotes } from './Quotes/Quotes';
import { ComposerInput } from './ComposerInput';
import { MESSAGE_COMPOSER_EXIT_FOCUS_NATIVE_ID } from '~/lib/constants/accessibility';

interface MessageComposerContentProps {
	recordingAudio: boolean;
	action: TMessageAction | undefined;
	showEmojiSearchbar: boolean;
	composerInputComponentRef: RefObject<IComposerInput>;
	composerInputRef: RefObject<any>;
	children?: ReactElement | null;
	onLayout: (event: LayoutChangeEvent) => void;
}

export const MessageComposerContent = memo<MessageComposerContentProps>(
	({ recordingAudio, action, showEmojiSearchbar, composerInputComponentRef, composerInputRef, children, onLayout }) => {
		const { colors } = useTheme();
		const backgroundColor = action === 'edit' ? colors.statusBackgroundWarning2 : colors.surfaceLight;

		if (recordingAudio) {
			return <RecordAudio />;
		}

		return (
			<View
				nativeID={MESSAGE_COMPOSER_EXIT_FOCUS_NATIVE_ID}
				style={[styles.container, { backgroundColor, borderTopColor: colors.strokeLight }]}
				testID='message-composer'
				onLayout={onLayout}>
				<View style={styles.input}>
					<Left />
					<ComposerInput ref={composerInputComponentRef} inputRef={composerInputRef} />
					<Right />
				</View>
				<Quotes />
				<Toolbar />
				{showEmojiSearchbar ? <EmojiSearchbar /> : null}
				<SendThreadToChannel />
				{children}
			</View>
		);
	}
);

const styles = StyleSheet.create({
	container: {
		borderTopWidth: 1,
		paddingHorizontal: 16,
		minHeight: MIN_HEIGHT
	},
	input: {
		flexDirection: 'row'
	}
});
