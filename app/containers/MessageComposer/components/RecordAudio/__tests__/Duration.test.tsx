import { render, screen } from '@testing-library/react-native';
import { useAudioRecorderState } from 'expo-audio';

import { Duration } from '../Duration';

jest.mock('~/theme', () => ({ useTheme: () => ({ theme: 'light', colors: { fontDefault: '#000' } }) }));

const recorder = {} as never;

beforeEach(() => {
	jest.clearAllMocks();
});

test('shows 00:00 when not recording', () => {
	jest.mocked(useAudioRecorderState).mockReturnValue({ isRecording: false, durationMillis: 0 } as never);
	render(<Duration audioRecorder={recorder} />);
	expect(screen.getByText('00:00')).toBeOnTheScreen();
});

test('updates rendered time from recorder state via formatTime', () => {
	jest.mocked(useAudioRecorderState).mockReturnValue({ isRecording: true, durationMillis: 65000 } as never);
	const { rerender } = render(<Duration audioRecorder={recorder} />);
	expect(screen.getByText('01:05')).toBeOnTheScreen();
	jest.mocked(useAudioRecorderState).mockReturnValue({ isRecording: true, durationMillis: 5000 } as never);
	rerender(<Duration audioRecorder={recorder} />);
	expect(screen.getByText('00:05')).toBeOnTheScreen();
});

test('keeps the last time when recording stops', () => {
	jest.mocked(useAudioRecorderState).mockReturnValue({ isRecording: true, durationMillis: 65000 } as never);
	const { rerender } = render(<Duration audioRecorder={recorder} />);
	expect(screen.getByText('01:05')).toBeOnTheScreen();
	jest.mocked(useAudioRecorderState).mockReturnValue({ isRecording: false, durationMillis: 0 } as never);
	rerender(<Duration audioRecorder={recorder} />);
	expect(screen.getByText('01:05')).toBeOnTheScreen();
});
