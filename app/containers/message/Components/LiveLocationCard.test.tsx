import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Alert } from 'react-native';

import LiveLocationCard from './LiveLocationCard';

jest.mock('../../../theme', () => ({
  useTheme: () => ({
    colors: {
      surfaceLight: '#fff',
      surfaceDisabled: '#eee',
      statusFontSuccess: 'green',
      statusFontDanger: 'red',
      strokeLight: '#ccc',
      fontDefault: '#000',
      fontTitlesLabels: '#111'
    }
  })
}));

const mockNavigate = jest.fn();
jest.mock('../../../lib/navigation/appNavigation', () => ({
  __esModule: true,
  default: { navigate: (...args: any[]) => mockNavigate(...args) }
}));

jest.mock('../../../i18n', () => ({
  __esModule: true,
  default: { t: (key: string) => key },
  t: (key: string) => key
}));

jest.mock('../../../views/LocationShare/LiveLocationPreviewModal', () => {
  const state = {
    statusListeners: [] as Array<(b: boolean) => void>,
    currentParams: {} as any,
    currentActive: false,
    reopenMock: jest.fn()
  };
  return {
    __esModule: true,
    addStatusChangeListener: (fn: (b: boolean) => void) => state.statusListeners.push(fn),
    removeStatusChangeListener: (fn: (b: boolean) => void) => {
      const i = state.statusListeners.indexOf(fn);
      if (i >= 0) state.statusListeners.splice(i, 1);
    },
    getCurrentLiveParams: () => state.currentParams,
    reopenLiveLocationModal: () => state.reopenMock(),
    isLiveLocationActive: () => state.currentActive,
    __emitStatus: (b: boolean) => state.statusListeners.forEach(l => l(b)),
    __setCurrentParams: (p: any) => { state.currentParams = p ?? {}; },
    __setIsActive: (b: boolean) => { state.currentActive = b; },
    __getReopenMock: () => state.reopenMock
  };
});

jest.mock('../../../views/LocationShare/services/handleLiveLocationUrl', () => {
  const ended = new Set<string>();
  const listeners: Array<(id: string) => void> = [];
  return {
    __esModule: true,
    isLiveLocationEnded: (id: string) => Promise.resolve(ended.has(id)),
    addLiveLocationEndedListener: (fn: (id: string) => void) => listeners.push(fn),
    removeLiveLocationEndedListener: (fn: (id: string) => void) => {
      const i = listeners.indexOf(fn);
      if (i >= 0) listeners.splice(i, 1);
    },
    __emitEnded: (id: string) => listeners.forEach(l => l(id)),
    __markEnded: (id: string) => ended.add(id),
    __clearEnded: () => ended.clear()
  };
});

jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

const flush = () => new Promise(res => setTimeout(res, 0));
const freshLiveId = () => `live_${Date.now()}_abc`;
const oldLiveId = (mins = 31) => `live_${Date.now() - mins * 60 * 1000}_abc`;

const PreviewModal = require('../../../views/LocationShare/LiveLocationPreviewModal');
const HandleUrl = require('../../../views/LocationShare/services/handleLiveLocationUrl');

beforeEach(() => {
  jest.clearAllMocks();
  PreviewModal.__setCurrentParams({});
  PreviewModal.__setIsActive(false);
  HandleUrl.__clearEnded();
});

describe('LiveLocationCard', () => {
  it('renders ACTIVE text for a fresh id + recent timestamp', () => {
    const id = freshLiveId();
    const { getByText } = render(
      <LiveLocationCard
        msg={`rocketchat://live-location?liveLocationId=${id}&rid=GENERAL`}
        isActive
        messageTimestamp={Date.now()}
      />
    );
    expect(getByText('Live_Location')).toBeTruthy();
    expect(getByText('Active_Tap_to_view')).toBeTruthy();
  });

  it('navigates to viewer on press when active and not current session', () => {
    const id = freshLiveId();
    const { getByText } = render(
      <LiveLocationCard
        msg={`rocketchat://live-location?liveLocationId=${id}&rid=GENERAL`}
        isActive
        messageTimestamp={Date.now()}
      />
    );
    const card = getByText('Live_Location').parent?.parent;
    fireEvent.press(card!);
    expect(mockNavigate).toHaveBeenCalledWith('LiveLocationViewerModal', { rid: 'GENERAL', msgId: id });
  });

  it('shows block alert when another session is active', () => {
    const id = freshLiveId();
    PreviewModal.__setIsActive(true);
    const { getByText } = render(
      <LiveLocationCard
        msg={`rocketchat://live-location?liveLocationId=${id}&rid=GENERAL`}
        isActive
        messageTimestamp={Date.now()}
      />
    );
    const card = getByText('Live_Location').parent?.parent;
    fireEvent.press(card!);
    expect(Alert.alert).toHaveBeenCalledWith('Live_Location_Active', 'Live_Location_Active_Block_Message');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('renders INACTIVE if messageTimestamp > 10 minutes old', () => {
    const id = freshLiveId();
    const ts = Date.now() - 11 * 60 * 1000;
    const { getByText } = render(
      <LiveLocationCard
        msg={`rocketchat://live-location?liveLocationId=${id}&rid=GENERAL`}
        isActive
        messageTimestamp={ts}
      />
    );
    expect(getByText('Inactive')).toBeTruthy();
  });

  it('renders INACTIVE if encoded id time is older than 30 minutes', () => {
    const id = oldLiveId(31);
    const { getByText } = render(
      <LiveLocationCard
        msg={`rocketchat://live-location?liveLocationId=${id}&rid=GENERAL`}
        isActive
        messageTimestamp={Date.now()}
      />
    );
    expect(getByText('Inactive')).toBeTruthy();
  });

  it('pressing inactive card shows ended alert and calls onPress', async () => {
    const id = freshLiveId();
    const onPress = jest.fn();
    HandleUrl.__markEnded(id);
    const { getByText, findByText } = render(
      <LiveLocationCard
        msg={`rocketchat://live-location?liveLocationId=${id}&rid=GENERAL`}
        isActive={false}
        messageTimestamp={Date.now()}
        onPress={onPress}
      />
    );
    await findByText('Inactive');
    const card = getByText('Live_Location').parent?.parent;
    fireEvent.press(card!);
    expect(Alert.alert).toHaveBeenCalledWith('Live_Location_Ended_Title', 'Live_Location_Ended_Message');
    expect(onPress).toHaveBeenCalled();
  });

  it('reacts to status change event (active → inactive)', async () => {
    const id = freshLiveId();
    const { getByText, findByText } = render(
      <LiveLocationCard
        msg={`rocketchat://live-location?liveLocationId=${id}&rid=GENERAL`}
        isActive
        messageTimestamp={Date.now()}
      />
    );
    expect(getByText('Active_Tap_to_view')).toBeTruthy();
    PreviewModal.__setCurrentParams({ liveLocationId: id });
    await act(async () => {
      PreviewModal.__emitStatus(false);
      await flush();
    });
    await findByText('Inactive');
    expect(await findByText('Inactive')).toBeTruthy();
  });

  it('reacts to ended event by flipping to inactive', async () => {
    const id = freshLiveId();
    const { getByText, findByText } = render(
      <LiveLocationCard
        msg={`rocketchat://live-location?liveLocationId=${id}&rid=GENERAL`}
        isActive
        messageTimestamp={Date.now()}
      />
    );
    expect(getByText('Active_Tap_to_view')).toBeTruthy();
    await act(async () => {
      HandleUrl.__markEnded(id);
      HandleUrl.__emitEnded(id);
      await flush();
    });
    expect(await findByText('Inactive')).toBeTruthy();
  });

  it('syncs with current session when ids match (reopen viewer)', () => {
    const id = freshLiveId();
    PreviewModal.__setCurrentParams({ liveLocationId: id });
    PreviewModal.__setIsActive(true);
    const reopenMock: jest.Mock = PreviewModal.__getReopenMock();
    const { getByText } = render(
      <LiveLocationCard
        msg={`rocketchat://live-location?liveLocationId=${id}&rid=GENERAL`}
        isActive={true}
        messageTimestamp={Date.now()}
      />
    );
    const card = getByText('Live_Location').parent?.parent;
    fireEvent.press(card!);
    expect(reopenMock).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('renders with missing id and with empty msg', () => {
    const { getByText: getByText1 } = render(
      <LiveLocationCard msg={'rocketchat://live-location?rid=GENERAL'} isActive messageTimestamp={Date.now()} />
    );
    expect(getByText1('Live_Location')).toBeTruthy();
    const { getByText: getByText2 } = render(
      <LiveLocationCard msg={'' as unknown as string} isActive messageTimestamp={Date.now()} />
    );
    expect(getByText2('Live_Location')).toBeTruthy();
  });
});
