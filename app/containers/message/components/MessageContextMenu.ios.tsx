import { type ReactElement } from 'react';
import { Host } from '@expo/ui';
import { Button, ContextMenu, RNHostView, Text, VStack } from '@expo/ui/swift-ui';
import { disabled, font, foregroundStyle, frame, lineLimit, padding } from '@expo/ui/swift-ui/modifiers';
import { View } from 'react-native';

import { useTheme } from '~/theme';
import { useMessageContextMenu } from '../hooks/useMessageContextMenu';

const PREVIEW_WIDTH = 300;

const MessageContextMenu = ({ children }: { children: ReactElement }) => {
	const { colors, theme } = useTheme();
	const { enabled, options, author, text, width } = useMessageContextMenu();

	if (!enabled) {
		return children;
	}

	return (
		<Host style={{ width }} matchContents={{ vertical: true }} colorScheme={theme === 'light' ? 'light' : 'dark'}>
			<ContextMenu>
				<ContextMenu.Trigger>
					<RNHostView matchContents>
						<View style={{ width }}>{children}</View>
					</RNHostView>
				</ContextMenu.Trigger>
				<ContextMenu.Preview>
					<VStack
						alignment='leading'
						spacing={4}
						modifiers={[frame({ width: PREVIEW_WIDTH, alignment: 'leading' }), padding({ all: 16 })]}>
						<Text modifiers={[font({ textStyle: 'headline' }), foregroundStyle(colors.fontTitlesLabels), lineLimit(1)]}>
							{author}
						</Text>
						{text ? (
							<Text modifiers={[font({ textStyle: 'body' }), foregroundStyle(colors.fontDefault), lineLimit(8)]}>{text}</Text>
						) : null}
					</VStack>
				</ContextMenu.Preview>
				<ContextMenu.Items>
					{options.map(option => (
						<Button
							key={option.testID ?? option.title}
							testID={option.testID}
							label={option.title}
							role={option.danger ? 'destructive' : 'default'}
							onPress={option.onPress}
							modifiers={[disabled(option.enabled === false)]}
						/>
					))}
				</ContextMenu.Items>
			</ContextMenu>
		</Host>
	);
};

export default MessageContextMenu;
