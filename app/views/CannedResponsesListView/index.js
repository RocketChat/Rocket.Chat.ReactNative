import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import I18n from '../../i18n';

import * as List from '../../containers/List';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import { useTheme } from '../../theme';
import HeaderCanned from './HeaderCanned';
import CannedResponseItem from './CannedResponseItem';

const CannedResponsesListView = (props) => {
	const { theme } = useTheme();

	useEffect(() => {
		const { navigation } = props;
		navigation.setOptions({
			title: I18n.t('Canned_Responses')

		});
	}, []);

	return (
		<SafeAreaView>
			<StatusBar />

			<HeaderCanned theme={theme} />
			<CannedResponseItem theme={theme} />
			<List.Separator />

		</SafeAreaView>
	);
};

CannedResponsesListView.propTypes = {
	navigation: PropTypes.object
};

export default CannedResponsesListView;
