import React from 'react';
import { ScrollView } from 'react-native';

import TagInput from '../../app/components/tags';

const values = ['guilherme.gazzo', 'g1', 'gestcagado', '4', '5', '6', '7', '8', '9', '10', '11', 'grandaooooooo	dasdasdasdasda.oooooooooooooooo', '12', '13', '14', '15'];
export default (
	<ScrollView>
		<TagInput onPress={(item, index) => values.splice(index, 1)} values={values} />
	</ScrollView>
);
