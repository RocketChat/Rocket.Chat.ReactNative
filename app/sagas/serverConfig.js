import { Platform } from 'react-native';

// Development URLs
const DEV_SERVER_URL_IOS = 'http://localhost:3000';
const DEV_SERVER_URL_ANDROID = 'http://10.0.2.2:3000';

// Production URL
// const PROD_SERVER_URL = 'https://app.t1dreachout.com';

const PROD_SERVER_URL = 'https://staging.t1dreachout.com';

// uncomment and export as default to enable development with local backend
// const SERVER_URL = __DEV__ ? Platform.select({
//   ios: DEV_SERVER_URL_IOS,
//   android: DEV_SERVER_URL_ANDROID,
// }) : PROD_SERVER_URL;

export default PROD_SERVER_URL;
