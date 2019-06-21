import { Client } from 'bugsnag-react-native';

import BUGSNAG_APIKEY from './key';

export const bugsnag = new Client(BUGSNAG_APIKEY);
