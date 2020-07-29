import { isOfficialBuild } from "./app/constants/environment";

let BugSnagApiKey = (isOfficialBuild) ? '0e62781637138bc11e6ad3ca14c03899' : '';

export default {
	BUGSNAG_API_KEY: BugSnagApiKey
};
