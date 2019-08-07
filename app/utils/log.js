import { Client } from 'bugsnag-react-native';
import config from '../../config';

const bugsnag = new Client(config.BUGSNAG_API_KEY);

export const loggerConfig = bugsnag.config;
export default bugsnag.notify;
