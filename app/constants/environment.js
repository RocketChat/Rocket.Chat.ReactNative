import RNConfigReader from 'react-native-config-reader';

// Checks for undefined values
const fDroidBuild = RNConfigReader.FDROID_BUILD || false;
const officialBuild = RNConfigReader.OFFICIAL_BUILD || false;

export const isOfficialBuild = officialBuild;
export const isFDroidBuild = fDroidBuild;
