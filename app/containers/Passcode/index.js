import React, { useState } from 'react';
import { View } from 'react-native';
import { Col, Row, Grid } from 'react-native-easy-grid';
import _ from 'lodash';

import styles from './styles';
import Button from './Button';
import Dots from './Dots';
import Title from './Title';
import Subtitle from './Subtitle';

const PASSCODE_LENGTH = 6;

const Passcode = ({ theme }) => {
	const [passcode, setPasscode] = useState('');

	const handleEnd = () => {
		alert('END')
	};

	const onPressNumber = text => setPasscode((p) => {
		const newPasscode = p + text;
		if (newPasscode?.length === PASSCODE_LENGTH) {
			handleEnd();
			return '';
		}
		return newPasscode;
	});

	const onPressDelete = () => setPasscode((p) => {
		if (p?.length > 0) {
			const newPasscode = p.slice(0, -1);
			return newPasscode;
		}
		return '';
	});

	return (
		<View style={styles.container}>
			<View style={styles.container}>
				<View style={styles.viewTitle}>
					<Title theme={theme} />
					<Subtitle theme={theme} />
				</View>
				<View style={styles.flexCirclePasscode}>
					<Dots passcode={passcode} theme={theme} length={PASSCODE_LENGTH} />
				</View>
				<Grid style={styles.grid}>
					<Row style={styles.row}>
						{_.range(1, 4).map(i => (
							<Col key={i} style={styles.colButtonCircle}>
								<Button text={i} theme={theme} onPress={onPressNumber} />
							</Col>
						))}
					</Row>
					<Row style={styles.row}>
						{_.range(4, 7).map(i => (
							<Col key={i} style={styles.colButtonCircle}>
								<Button text={i} theme={theme} onPress={onPressNumber} />
							</Col>
						))}
					</Row>
					<Row style={styles.row}>
						{_.range(7, 10).map(i => (
							<Col key={i} style={styles.colButtonCircle}>
								<Button text={i} theme={theme} onPress={onPressNumber} />
							</Col>
						))}
					</Row>
					<Row style={styles.row}>
						<Col style={styles.colButtonCircle} />
						<Col style={styles.colButtonCircle}>
							<Button text='0' theme={theme} onPress={onPressNumber} />
						</Col>
						<Col style={styles.colButtonCircle}>
							<Button text='X' theme={theme} onPress={onPressDelete} />
						</Col>
					</Row>
				</Grid>
			</View>
		</View>
	);
};

export default Passcode;
