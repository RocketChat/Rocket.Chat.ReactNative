import { generateSnapshots } from '~/.rnstorybook/generateSnapshots';
import * as controlButton from '../ConferenceControlButton.stories';
import * as controls from '../ConferenceControls.stories';
import * as header from '../ConferenceHeader.stories';
import * as message from '../ConferenceMessage.stories';
import * as tile from '../ParticipantTileView.stories';
import * as preflight from '../PreflightPreview.stories';

jest.mock('expo-camera', () => ({ CameraView: 'CameraView' }));

const withoutThemes = (stories: object) => Object.fromEntries(Object.entries(stories).filter(([name]) => name !== 'Themes'));

generateSnapshots(withoutThemes(controlButton));
generateSnapshots(withoutThemes(controls));
generateSnapshots(withoutThemes(header));
generateSnapshots(withoutThemes(message));
generateSnapshots(withoutThemes(tile));
generateSnapshots(withoutThemes(preflight));
