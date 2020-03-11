import { AsyncStorage } from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';

const officialAppGroupPath = `${ RNFetchBlob.fs.syncPathAppGroup('group.ios.chat.rocket') }/default.db`;
const experimentalAppGroupPath = `${ RNFetchBlob.fs.syncPathAppGroup('group.chat.rocket.experimental') }/default.db`;

// it'll copy the database of servers
// from the official folder
// to the experimental folder
const databaseCopy = async() => {
	try {
		const exists = await RNFetchBlob.fs.exists(officialAppGroupPath);
		if (exists) {
			await RNFetchBlob.fs.cp(officialAppGroupPath, experimentalAppGroupPath);
		}
		await AsyncStorage.setItem('wasCopied', '1');
	} catch {
		// do nothing
	}
};

export default databaseCopy;
