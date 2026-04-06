# VoIP Accessibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add screen reader support, landscape layout, and font scaling to new VoIP screens on `feat.voip-lib-new`.

**Architecture:** New `useIsScreenReaderEnabled` hook wires into `useControlsVisible` so both `CallerInfo` and `CallButtons` automatically keep controls visible when a screen reader is active. Landscape layout is driven by `useResponsiveLayout()` (the existing shared context) — each component reads `width`/`height` from it and derives `isLandscape` independently, avoiding prop drilling and conflicts with tablet layout.

**Tech Stack:** React Native, Zustand (`useCallStore`), `react-native-a11y-order`, `@testing-library/react-native`, `useResponsiveLayout` context.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `app/lib/hooks/useIsScreenReaderEnabled.ts` | Reactive boolean: VoiceOver/TalkBack active |
| Create | `app/lib/hooks/useIsScreenReaderEnabled.test.ts` | Tests for the hook |
| Modify | `app/lib/services/voip/useCallStore.ts:301` | `useControlsVisible` — always true when screen reader on |
| Modify | `app/i18n/locales/en.json:911` | Add `Toggle_call_controls` key |
| Modify | `app/views/CallView/components/CallerInfo.tsx` | Screen reader bypass + a11y label + landscape avatar |
| Modify | `app/views/CallView/components/CallButtons.tsx` | `accessibilityElementsHidden` + landscape styles |
| Modify | `app/views/CallView/index.tsx` | Landscape container flex direction |
| Modify | `app/views/CallView/styles.ts` | Landscape style variants |
| Modify | `app/views/CallView/index.test.tsx` | Screen reader + landscape tests |
| Modify | `app/views/CallView/CallView.stories.tsx` | Landscape story |
| Modify | `app/views/CallView/components/Dialpad/DialpadButton.tsx` | a11y label + role |
| Modify | `app/containers/NewMediaCall/PeerItem.tsx` | a11y label + role |

---

## Task 1: `useIsScreenReaderEnabled` hook

**Files:**
- Create: `app/lib/hooks/useIsScreenReaderEnabled.ts`
- Create: `app/lib/hooks/useIsScreenReaderEnabled.test.ts`

- [ ] **Step 1: Write the failing tests**

`app/lib/hooks/useIsScreenReaderEnabled.test.ts`:
```ts
import { renderHook, act } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { useIsScreenReaderEnabled } from './useIsScreenReaderEnabled';

describe('useIsScreenReaderEnabled', () => {
	beforeEach(() => {
		jest.spyOn(AccessibilityInfo, 'isScreenReaderEnabled').mockResolvedValue(false);
		jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({ remove: jest.fn() } as any);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('returns false initially', () => {
		const { result } = renderHook(() => useIsScreenReaderEnabled());
		expect(result.current).toBe(false);
	});

	it('returns true after isScreenReaderEnabled resolves true', async () => {
		jest.spyOn(AccessibilityInfo, 'isScreenReaderEnabled').mockResolvedValue(true);
		const { result } = renderHook(() => useIsScreenReaderEnabled());
		await act(async () => {});
		expect(result.current).toBe(true);
	});

	it('updates when screenReaderChanged event fires', () => {
		let capturedListener: (enabled: boolean) => void = () => {};
		jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation((_event, cb) => {
			capturedListener = cb as (enabled: boolean) => void;
			return { remove: jest.fn() } as any;
		});

		const { result } = renderHook(() => useIsScreenReaderEnabled());

		act(() => {
			capturedListener(true);
		});

		expect(result.current).toBe(true);
	});

	it('removes the event listener on unmount', () => {
		const removeMock = jest.fn();
		jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({ remove: removeMock } as any);

		const { unmount } = renderHook(() => useIsScreenReaderEnabled());
		unmount();

		expect(removeMock).toHaveBeenCalled();
	});
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
yarn test --testPathPattern=useIsScreenReaderEnabled
```

Expected: FAIL — `Cannot find module './useIsScreenReaderEnabled'`

- [ ] **Step 3: Implement the hook**

`app/lib/hooks/useIsScreenReaderEnabled.ts`:
```ts
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export const useIsScreenReaderEnabled = (): boolean => {
	const [enabled, setEnabled] = useState(false);

	useEffect(() => {
		AccessibilityInfo.isScreenReaderEnabled().then(setEnabled);
		const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', setEnabled);
		return () => subscription.remove();
	}, []);

	return enabled;
};
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
yarn test --testPathPattern=useIsScreenReaderEnabled
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add app/lib/hooks/useIsScreenReaderEnabled.ts app/lib/hooks/useIsScreenReaderEnabled.test.ts
git commit -m "feat(a11y): add useIsScreenReaderEnabled hook"
```

---

## Task 2: i18n key

**Files:**
- Modify: `app/i18n/locales/en.json:911`

- [ ] **Step 1: Add the key**

In `app/i18n/locales/en.json`, after line 911 (`"To_download": "To download",`), insert:

```json
  "Toggle_call_controls": "Toggle call controls",
```

- [ ] **Step 2: Commit**

```bash
git add app/i18n/locales/en.json
git commit -m "feat(a11y): add Toggle_call_controls i18n key"
```

---

## Task 3: `useControlsVisible` — always true when screen reader is active

**Files:**
- Modify: `app/lib/services/voip/useCallStore.ts:301`

- [ ] **Step 1: Update `useControlsVisible`**

In `app/lib/services/voip/useCallStore.ts`, replace line 301:

```ts
export const useControlsVisible = () => useCallStore(state => state.controlsVisible);
```

with:

```ts
import { useIsScreenReaderEnabled } from '../../hooks/useIsScreenReaderEnabled';

export const useControlsVisible = () => {
	const controlsVisible = useCallStore(state => state.controlsVisible);
	const isScreenReaderEnabled = useIsScreenReaderEnabled();
	return controlsVisible || isScreenReaderEnabled;
};
```

Add the import at the top of the file with the other imports.

- [ ] **Step 2: Run existing CallView tests to confirm nothing breaks**

```bash
yarn test --testPathPattern=CallView/index
```

Expected: PASS (all existing tests still pass)

- [ ] **Step 3: Commit**

```bash
git add app/lib/services/voip/useCallStore.ts
git commit -m "feat(a11y): keep call controls visible when screen reader is active"
```

---

## Task 4: `CallerInfo` — screen reader fix + accessibility label

**Files:**
- Modify: `app/views/CallView/components/CallerInfo.tsx`
- Modify: `app/views/CallView/index.test.tsx`

- [ ] **Step 1: Write the failing test**

Add `AccessibilityInfo` to the existing React Native import at the top of `app/views/CallView/index.test.tsx`:

```ts
import { act } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
```

Then add this test inside `describe('CallView', ...)`:

```ts
it('should not call toggleControlsVisible when screen reader is enabled', async () => {
	jest.spyOn(AccessibilityInfo, 'isScreenReaderEnabled').mockResolvedValue(false);
	let capturedListener: (enabled: boolean) => void = () => {};
	jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation((_event: string, cb: any) => {
		capturedListener = cb;
		return { remove: jest.fn() } as any;
	});

	setStoreState({ callState: 'active' });
	const toggleControlsVisible = jest.fn();
	useCallStore.setState({ toggleControlsVisible });

	const { getByTestId } = render(
		<Wrapper>
			<CallView />
		</Wrapper>
	);

	await act(async () => {
		capturedListener(true);
	});

	fireEvent.press(getByTestId('caller-info-toggle'));
	expect(toggleControlsVisible).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
yarn test --testPathPattern=CallView/index
```

Expected: FAIL — `toggleControlsVisible` is called even with screen reader on

- [ ] **Step 3: Update `CallerInfo.tsx`**

```tsx
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import AvatarContainer from '../../../containers/Avatar';
import I18n from '../../../i18n';
import { useCallContact, useCallStore, useControlsVisible } from '../../../lib/services/voip/useCallStore';
import { useIsScreenReaderEnabled } from '../../../lib/hooks/useIsScreenReaderEnabled';
import { CONTROLS_ANIMATION_DURATION, styles } from '../styles';
import { useTheme } from '../../../theme';

const CallerInfo = (): React.ReactElement => {
	const { colors } = useTheme();
	const contact = useCallContact();
	const toggleControlsVisible = useCallStore(state => state.toggleControlsVisible);
	const controlsVisible = useControlsVisible();
	const isScreenReaderEnabled = useIsScreenReaderEnabled();

	const callerRowStyle = useAnimatedStyle(() => ({
		opacity: withTiming(controlsVisible ? 1 : 0, { duration: CONTROLS_ANIMATION_DURATION }),
		transform: [{ translateY: withTiming(controlsVisible ? 0 : 10, { duration: CONTROLS_ANIMATION_DURATION }) }]
	}));

	const name = contact.displayName || contact.username || I18n.t('Unknown');
	const avatarText = contact.username || name;

	return (
		<Pressable
			style={styles.callerInfoContainer}
			testID='caller-info-toggle'
			onPress={isScreenReaderEnabled ? undefined : toggleControlsVisible}
			accessibilityLabel={I18n.t('Toggle_call_controls')}
			accessibilityRole='button'>
			<View style={styles.avatarContainer}>
				<AvatarContainer text={avatarText} size={120} borderRadius={2} />
			</View>
			<Animated.View style={[styles.callerRow, callerRowStyle]}>
				<Text style={[styles.caller, { color: colors.fontDefault }]} numberOfLines={1} testID='caller-info-name'>
					{name}
				</Text>
			</Animated.View>
		</Pressable>
	);
};

export default CallerInfo;
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
yarn test --testPathPattern=CallView/index
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/views/CallView/components/CallerInfo.tsx app/views/CallView/index.test.tsx
git commit -m "feat(a11y): disable tap-to-hide controls when screen reader is active"
```

---

## Task 5: `CallButtons` — hide from screen reader when visually hidden

**Files:**
- Modify: `app/views/CallView/components/CallButtons.tsx`

- [ ] **Step 1: Add `accessibilityElementsHidden` to the animated container**

In `app/views/CallView/components/CallButtons.tsx`, update the `Animated.View` opening tag:

```tsx
<Animated.View
	style={[styles.buttonsContainer, { borderTopColor: colors.strokeExtraLight }, containerStyle]}
	pointerEvents={controlsVisible ? 'auto' : 'none'}
	accessibilityElementsHidden={!controlsVisible}
	testID='call-buttons'>
```

- [ ] **Step 2: Run tests**

```bash
yarn test --testPathPattern=CallView/index
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/views/CallView/components/CallButtons.tsx
git commit -m "feat(a11y): hide call buttons from screen reader when controls are not visible"
```

---

## Task 6: `DialpadButton` — accessibility label and role

**Files:**
- Modify: `app/views/CallView/components/Dialpad/DialpadButton.tsx`

- [ ] **Step 1: Add a11y props to the Pressable**

In `app/views/CallView/components/Dialpad/DialpadButton.tsx`, update the `Pressable`:

```tsx
<Pressable
	onPress={handleDigitPress}
	accessibilityLabel={letters ? `${digit} ${letters}` : digit}
	accessibilityRole='button'
	style={({ pressed }) => [
		styles.button,
		{ backgroundColor: pressed ? colors.buttonBackgroundSecondaryPress : colors.buttonBackgroundSecondaryDefault }
	]}>
```

- [ ] **Step 2: Run lint**

```bash
yarn lint
```

Expected: no new errors

- [ ] **Step 3: Commit**

```bash
git add app/views/CallView/components/Dialpad/DialpadButton.tsx
git commit -m "feat(a11y): add accessibility label and role to DialpadButton"
```

---

## Task 7: `PeerItem` — accessibility label and role

**Files:**
- Modify: `app/containers/NewMediaCall/PeerItem.tsx`

- [ ] **Step 1: Add a11y props to the Pressable**

In `app/containers/NewMediaCall/PeerItem.tsx`, update the `Pressable`:

```tsx
<Pressable
	style={({ pressed }) => [
		styles.container,
		{ backgroundColor: pressed && isIOS ? colors.surfaceSelected : colors.surfaceLight }
	]}
	onPress={() => onSelectOption(item)}
	accessibilityLabel={item.label}
	accessibilityRole='button'
	testID={`new-media-call-option-${item.value}`}
	android_ripple={{ color: colors.surfaceSelected }}>
```

- [ ] **Step 2: Run lint**

```bash
yarn lint
```

Expected: no new errors

- [ ] **Step 3: Commit**

```bash
git add app/containers/NewMediaCall/PeerItem.tsx
git commit -m "feat(a11y): add accessibility label and role to PeerItem"
```

---

## Task 8: `CallView` landscape layout

**Files:**
- Modify: `app/views/CallView/styles.ts`
- Modify: `app/views/CallView/index.tsx`
- Modify: `app/views/CallView/components/CallerInfo.tsx`
- Modify: `app/views/CallView/components/CallButtons.tsx`
- Modify: `app/views/CallView/CallView.stories.tsx`
- Modify: `app/views/CallView/index.test.tsx`

- [ ] **Step 1: Write the failing landscape test**

Add to `app/views/CallView/index.test.tsx`. First, add this import at the top (alongside the existing `ResponsiveLayoutContext` import from the mock — the mock re-exports the actual module's context, so importing from the same path works):

```ts
import { ResponsiveLayoutContext } from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';
```

Then add a helper and test inside `describe('CallView', ...)`:

```ts
const LandscapeWrapper = ({ children }: { children: React.ReactNode }) => (
	<ResponsiveLayoutContext.Provider
		value={{ fontScale: 1, width: 800, height: 400, isLargeFontScale: false, fontScaleLimited: 1, rowHeight: 75, rowHeightCondensed: 60 }}>
		<Provider store={mockedStore}>{children}</Provider>
	</ResponsiveLayoutContext.Provider>
);

it('should apply landscape styles when width > height', () => {
	setStoreState({ callState: 'active' });
	const { getByTestId } = render(
		<LandscapeWrapper>
			<CallView />
		</LandscapeWrapper>
	);

	const container = getByTestId('call-view-container');
	expect(container.props.style).toEqual(
		expect.arrayContaining([expect.objectContaining({ flexDirection: 'row' })])
	);
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
yarn test --testPathPattern=CallView/index
```

Expected: FAIL — `Unable to find an element with testID: call-view-container`

- [ ] **Step 3: Add landscape styles to `styles.ts`**

In `app/views/CallView/styles.ts`, add these entries to the `StyleSheet.create({...})` call:

```ts
contentContainerLandscape: {
	flexDirection: 'row',
	alignItems: 'stretch'
},
callerInfoContainerLandscape: {
	flex: 2
},
buttonsContainerLandscape: {
	flex: 3,
	borderTopWidth: 0,
	borderLeftWidth: StyleSheet.hairlineWidth,
	justifyContent: 'center'
},
buttonsRowLandscape: {
	marginBottom: 16
}
```

- [ ] **Step 4: Update `CallView/index.tsx`**

```tsx
import React from 'react';
import { View } from 'react-native';

import { useCallStore } from '../../lib/services/voip/useCallStore';
import CallerInfo from './components/CallerInfo';
import { styles } from './styles';
import { useTheme } from '../../theme';
import { CallButtons } from './components/CallButtons';
import { useResponsiveLayout } from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';

const CallView = (): React.ReactElement | null => {
	'use memo';

	const { colors } = useTheme();
	const call = useCallStore(state => state.call);
	const { width, height } = useResponsiveLayout();
	const isLandscape = width > height;

	if (!call) {
		return null;
	}

	return (
		<View
			testID='call-view-container'
			style={[styles.contentContainer, isLandscape && styles.contentContainerLandscape, { backgroundColor: colors.surfaceLight }]}>
			<CallerInfo />
			<CallButtons />
		</View>
	);
};

export default CallView;
```

- [ ] **Step 5: Update `CallerInfo.tsx` for landscape**

In `app/views/CallView/components/CallerInfo.tsx`, add `useResponsiveLayout` import and landscape avatar size:

```tsx
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import AvatarContainer from '../../../containers/Avatar';
import I18n from '../../../i18n';
import { useCallContact, useCallStore, useControlsVisible } from '../../../lib/services/voip/useCallStore';
import { useIsScreenReaderEnabled } from '../../../lib/hooks/useIsScreenReaderEnabled';
import { useResponsiveLayout } from '../../../lib/hooks/useResponsiveLayout/useResponsiveLayout';
import { CONTROLS_ANIMATION_DURATION, styles } from '../styles';
import { useTheme } from '../../../theme';

const CallerInfo = (): React.ReactElement => {
	const { colors } = useTheme();
	const contact = useCallContact();
	const toggleControlsVisible = useCallStore(state => state.toggleControlsVisible);
	const controlsVisible = useControlsVisible();
	const isScreenReaderEnabled = useIsScreenReaderEnabled();
	const { width, height } = useResponsiveLayout();
	const isLandscape = width > height;

	const callerRowStyle = useAnimatedStyle(() => ({
		opacity: withTiming(controlsVisible ? 1 : 0, { duration: CONTROLS_ANIMATION_DURATION }),
		transform: [{ translateY: withTiming(controlsVisible ? 0 : 10, { duration: CONTROLS_ANIMATION_DURATION }) }]
	}));

	const name = contact.displayName || contact.username || I18n.t('Unknown');
	const avatarText = contact.username || name;

	return (
		<Pressable
			style={[styles.callerInfoContainer, isLandscape && styles.callerInfoContainerLandscape]}
			testID='caller-info-toggle'
			onPress={isScreenReaderEnabled ? undefined : toggleControlsVisible}
			accessibilityLabel={I18n.t('Toggle_call_controls')}
			accessibilityRole='button'>
			<View style={styles.avatarContainer}>
				<AvatarContainer text={avatarText} size={isLandscape ? 80 : 120} borderRadius={2} />
			</View>
			<Animated.View style={[styles.callerRow, callerRowStyle]}>
				<Text style={[styles.caller, { color: colors.fontDefault }]} numberOfLines={1} testID='caller-info-name'>
					{name}
				</Text>
			</Animated.View>
		</Pressable>
	);
};

export default CallerInfo;
```

- [ ] **Step 6: Update `CallButtons.tsx` for landscape**

In `app/views/CallView/components/CallButtons.tsx`, add `useResponsiveLayout` and landscape styles:

```tsx
import React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import I18n from '../../../i18n';
import { useCallStore, useControlsVisible } from '../../../lib/services/voip/useCallStore';
import { useResponsiveLayout } from '../../../lib/hooks/useResponsiveLayout/useResponsiveLayout';
import CallActionButton from './CallActionButton';
import { CONTROLS_ANIMATION_DURATION, styles } from '../styles';
import { useTheme } from '../../../theme';
import { showActionSheetRef } from '../../../containers/ActionSheet';
import Dialpad from './Dialpad/Dialpad';

export const CallButtons = () => {
	'use memo';

	const { colors } = useTheme();
	const { width, height } = useResponsiveLayout();
	const isLandscape = width > height;

	const callState = useCallStore(state => state.callState);
	const isMuted = useCallStore(state => state.isMuted);
	const isOnHold = useCallStore(state => state.isOnHold);
	const isSpeakerOn = useCallStore(state => state.isSpeakerOn);

	const toggleMute = useCallStore(state => state.toggleMute);
	const toggleHold = useCallStore(state => state.toggleHold);
	const toggleSpeaker = useCallStore(state => state.toggleSpeaker);
	const endCall = useCallStore(state => state.endCall);

	const controlsVisible = useControlsVisible();

	const containerStyle = useAnimatedStyle(() => ({
		opacity: withTiming(controlsVisible ? 1 : 0, { duration: CONTROLS_ANIMATION_DURATION }),
		transform: [{ translateY: withTiming(controlsVisible ? 0 : 100, { duration: CONTROLS_ANIMATION_DURATION }) }]
	}));

	const isConnecting = callState === 'none' || callState === 'ringing' || callState === 'accepted';

	const handleMessage = () => {
		// TODO: Navigate to chat with caller
		// Navigation.navigate('RoomView', { rid, t: 'd' });
		alert('Message');
	};

	const handleDialpad = () => {
		showActionSheetRef({ children: <Dialpad /> });
	};

	const handleEndCall = () => {
		endCall();
	};

	return (
		<Animated.View
			style={[
				styles.buttonsContainer,
				isLandscape && styles.buttonsContainerLandscape,
				{ borderTopColor: colors.strokeExtraLight },
				containerStyle
			]}
			pointerEvents={controlsVisible ? 'auto' : 'none'}
			accessibilityElementsHidden={!controlsVisible}
			testID='call-buttons'>
			<View style={[styles.buttonsRow, isLandscape && styles.buttonsRowLandscape]}>
				<CallActionButton
					icon={isSpeakerOn ? 'audio' : 'audio-disabled'}
					label={I18n.t('Speaker')}
					onPress={toggleSpeaker}
					variant={isSpeakerOn ? 'active' : 'default'}
					disabled={isConnecting}
					testID='call-view-speaker'
				/>
				<CallActionButton
					icon={'pause-shape-unfilled'}
					label={isOnHold ? I18n.t('Unhold') : I18n.t('Hold')}
					onPress={toggleHold}
					variant={isOnHold ? 'active' : 'default'}
					disabled={isConnecting}
					testID='call-view-hold'
				/>
				<CallActionButton
					icon={isMuted ? 'microphone-disabled' : 'microphone'}
					label={isMuted ? I18n.t('Unmute') : I18n.t('Mute')}
					onPress={toggleMute}
					variant={isMuted ? 'active' : 'default'}
					disabled={isConnecting}
					testID='call-view-mute'
				/>
			</View>

			<View style={[styles.buttonsRow, isLandscape && styles.buttonsRowLandscape]}>
				<CallActionButton icon='message' label={I18n.t('Message')} onPress={handleMessage} testID='call-view-message' />
				<CallActionButton
					icon='phone-off'
					label={isConnecting ? I18n.t('Cancel') : I18n.t('End')}
					onPress={handleEndCall}
					variant='danger'
					testID='call-view-end'
				/>
				<CallActionButton
					icon='dialpad'
					label={I18n.t('Dialpad')}
					onPress={handleDialpad}
					disabled={isConnecting}
					testID='call-view-dialpad'
				/>
			</View>
		</Animated.View>
	);
};
```

- [ ] **Step 7: Add landscape story to `CallView.stories.tsx`**

In `app/views/CallView/CallView.stories.tsx`, add this story at the end and a landscape decorator helper:

```tsx
const landscapeResponsiveLayoutValue = {
	fontScale: 1,
	fontScaleLimited: 1,
	isLargeFontScale: false,
	rowHeight: 75,
	rowHeightCondensed: 60,
	width: 800,
	height: 400
};

export const LandscapeConnectedCall = () => {
	setStoreState({ callState: 'active', callStartTime: mockCallStartTime - 61000 });
	return (
		<ResponsiveLayoutContext.Provider value={landscapeResponsiveLayoutValue}>
			<CallView />
		</ResponsiveLayoutContext.Provider>
	);
};
```

- [ ] **Step 8: Run all CallView tests**

```bash
yarn test --testPathPattern=CallView/index
```

Expected: PASS (all tests including the new landscape test)

- [ ] **Step 9: Run lint**

```bash
yarn lint
```

Expected: no errors

- [ ] **Step 10: Commit**

```bash
git add app/views/CallView/styles.ts app/views/CallView/index.tsx app/views/CallView/components/CallerInfo.tsx app/views/CallView/components/CallButtons.tsx app/views/CallView/CallView.stories.tsx app/views/CallView/index.test.tsx
git commit -m "feat(a11y): landscape layout for CallView"
```

---

## Final check

- [ ] **Run full test suite**

```bash
yarn test --testPathPattern="CallView|useIsScreenReaderEnabled|PeerItem|DialpadButton"
```

Expected: all PASS

- [ ] **Run lint**

```bash
yarn lint
```

Expected: no errors
