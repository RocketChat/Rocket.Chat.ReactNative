import { type ReactElement, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, findNodeHandle, Text, View } from 'react-native';
import { A11y } from 'react-native-a11y-order';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CustomIcon } from '~/containers/CustomIcon';
import Ringer, { ERingerSounds } from '~/containers/Ringer';
import Touch from '~/containers/Touch';
import i18n from '~/i18n';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { hideNotification } from '~/lib/methods/helpers/notifications';
import { useStyle } from './style';

interface IIncomingCallShell {
	accessibilityLabel: string;
	header: ReactElement;
	onDecline: () => void;
	onAccept: () => void;
	testIDPrefix?: string;
}

const BUTTON_HIT_SLOP = { top: 12, right: 12, bottom: 12, left: 12 };
const FOCUS_DELAY_MS = 300;

const IncomingCallShell = ({
	accessibilityLabel,
	header,
	onDecline,
	onAccept,
	testIDPrefix
}: IIncomingCallShell): ReactElement => {
	const componentRef = useRef<View>(null);
	const [ringing, setRinging] = useState(true);
	const isMasterDetail = useMasterDetail();
	const styles = useStyle();
	const insets = useSafeAreaInsets();

	useEffect(() => {
		const focusOnIncomingCall = setTimeout(() => {
			const node = findNodeHandle(componentRef.current);
			if (node) {
				AccessibilityInfo.setAccessibilityFocus(node);
			}
		}, FOCUS_DELAY_MS);

		return () => clearTimeout(focusOnIncomingCall);
	}, [accessibilityLabel]);

	const answer = (action?: () => void) => () => {
		setRinging(false);
		hideNotification();
		action?.();
	};

	return (
		<A11y.Order>
			<A11y.Index index={1}>
				<View
					ref={componentRef}
					accessible
					accessibilityRole='button'
					accessibilityLabel={accessibilityLabel}
					testID={testIDPrefix ? `${testIDPrefix}-notification` : undefined}
					style={[styles.container, isMasterDetail && styles.small, { marginTop: insets.top }]}>
					<A11y.Index index={2} style={{ flex: 1 }}>
						{header}
					</A11y.Index>
					<View style={styles.row}>
						<A11y.Index index={3}>
							<Touch
								hitSlop={BUTTON_HIT_SLOP}
								onPress={answer()}
								accessibilityLabel={i18n.t('A11y_incoming_call_dismiss')}
								style={styles.closeButton}
								rectButtonStyle={styles.closeButtonContainer}
								testID={testIDPrefix ? `${testIDPrefix}-dismiss` : undefined}>
								<CustomIcon name='close' size={20} />
							</Touch>
						</A11y.Index>
						<A11y.Index index={4} style={styles.buttonWrapper}>
							<Touch
								hitSlop={BUTTON_HIT_SLOP}
								onPress={answer(onDecline)}
								style={styles.cancelButton}
								rectButtonStyle={styles.buttonContainer}
								testID={testIDPrefix ? `${testIDPrefix}-decline` : undefined}>
								<Text style={styles.buttonText}>{i18n.t('decline')}</Text>
							</Touch>
						</A11y.Index>
						<A11y.Index index={5} style={styles.buttonWrapper}>
							<Touch
								hitSlop={BUTTON_HIT_SLOP}
								onPress={answer(onAccept)}
								style={styles.acceptButton}
								rectButtonStyle={styles.buttonContainer}
								testID={testIDPrefix ? `${testIDPrefix}-accept` : undefined}>
								<Text style={styles.buttonText}>{i18n.t('accept')}</Text>
							</Touch>
						</A11y.Index>
					</View>
					{ringing ? <Ringer ringer={ERingerSounds.RINGTONE} /> : null}
				</View>
			</A11y.Index>
		</A11y.Order>
	);
};

export default IncomingCallShell;
