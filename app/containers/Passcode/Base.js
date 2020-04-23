import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { View } from 'react-native';
import { Col, Row, Grid } from 'react-native-easy-grid';
import _ from 'lodash';
import PropTypes from 'prop-types';

import styles from './styles';
import Button from './Button';
import Dots from './Dots';
import Title from './Title';
import Subtitle from './Subtitle';
import { TYPE } from './constants';

const PASSCODE_LENGTH = 6;

const Base = forwardRef(({
	theme, type, onEndProcess, previousPasscode
}, ref) => {
	const [passcode, setPasscode] = useState('');

	const wrongPasscode = () => {
		setPasscode('');
		console.log('TODO: wrong animation and vibration');
	};

	const onPressNumber = text => setPasscode((p) => {
		const currentPasscode = p + text;
		if (currentPasscode?.length === PASSCODE_LENGTH) {
			switch (type) {
				case TYPE.CHOOSE:
					// if (this.props.validationRegex && this.props.validationRegex.test(currentPasscode)) {
					// 	this.showError(true);
					// } else {
					// 	// this.endProcess(currentPasscode);
					onEndProcess(currentPasscode);
					// }
					break;
				case TYPE.CONFIRM:
					if (currentPasscode !== previousPasscode) {
						// this.showError();
						alert('SHOW ERROR');
					} else {
						// this.endProcess(currentPasscode);
						onEndProcess(currentPasscode);
					}
					break;
				case TYPE.ENTER:
					// this.props.endProcess(currentPasscode);
					onEndProcess(currentPasscode);
					// await delay(300);
					break;
				default:
					break;
			}
			return '';
		}
		return currentPasscode;
	});

	const onPressDelete = () => setPasscode((p) => {
		if (p?.length > 0) {
			const newPasscode = p.slice(0, -1);
			return newPasscode;
		}
		return '';
	});

	useImperativeHandle(ref, () => ({
		wrongPasscode
	}));

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
});

Base.propTypes = {
	theme: PropTypes.string,
	type: PropTypes.string,
	previousPasscode: PropTypes.string,
	onEndProcess: PropTypes.string
};

export default Base;
