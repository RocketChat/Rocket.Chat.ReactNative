import { generateSnapshots } from '~/.rnstorybook/generateSnapshots';
import * as controlButton from '../ConferenceControlButton.stories';
import * as controls from '../ConferenceControls.stories';
import * as header from '../ConferenceHeader.stories';
import * as message from '../ConferenceMessage.stories';
import * as tile from '../ParticipantTileView.stories';
import * as preflight from '../PreflightPreview.stories';

jest.mock('expo-camera', () => ({ CameraView: 'CameraView' }));

generateSnapshots(controlButton);
generateSnapshots(controls);
generateSnapshots(header);
generateSnapshots(message);
generateSnapshots(tile);
generateSnapshots(preflight);
