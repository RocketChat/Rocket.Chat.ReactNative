import { StyleSheet } from 'react-native';

import StatusRows from './StatusRows';
import { themes } from '../../lib/constants/colors';

export default {
	title: 'StatusRows'
};

const { fontTitlesLabels: statusTextColor, fontSecondaryInfo } = themes.light;

const futureExpiry = '2030-06-15T19:00:00.000Z';
const pastExpiry = '2020-01-01T00:00:00.000Z';

const styles = StyleSheet.create({
	expiryRow: {
		marginTop: 10
	}
});

export const All = () => (
	<>
		<StatusRows
			userId='user1'
			status='online'
			statusText='Working from home'
			statusTextColor={statusTextColor}
			fontSecondaryInfo={fontSecondaryInfo}
		/>
		<StatusRows userId='user2' status='busy' statusTextColor={statusTextColor} fontSecondaryInfo={fontSecondaryInfo} />
		<StatusRows
			status='away'
			statusText='Away for lunch'
			statusTextColor={statusTextColor}
			fontSecondaryInfo={fontSecondaryInfo}
		/>
		<StatusRows
			userId='user3'
			status='online'
			statusText='Old status'
			statusExpiresAt={pastExpiry}
			statusTextColor={statusTextColor}
			fontSecondaryInfo={fontSecondaryInfo}
		/>
		<StatusRows
			userId='user4'
			status='online'
			statusText='In a meeting'
			statusExpiresAt={futureExpiry}
			statusTextColor={statusTextColor}
			fontSecondaryInfo={fontSecondaryInfo}
		/>
		<StatusRows
			userId='user5'
			status='online'
			statusText='Working remotely'
			statusExpiresAt={futureExpiry}
			statusTextColor={statusTextColor}
			fontSecondaryInfo={fontSecondaryInfo}
			expiryRowStyle={styles.expiryRow}
		/>
	</>
);
