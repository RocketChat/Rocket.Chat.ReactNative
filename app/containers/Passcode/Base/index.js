import React, {
	useState, forwardRef, useImperativeHandle, useRef
} from 'react';
import { Col, Row, Grid } from 'react-native-easy-grid';
import _ from 'lodash';
import PropTypes from 'prop-types';
import * as Animatable from 'react-native-animatable';
import * as Haptics from 'expo-haptics';

import styles from './styles';
import Button from './Button';
import Dots from './Dots';
import { TYPE } from '../constants';
import { themes } from '../../../constants/colors';
import { PASSCODE_LENGTH } from '../../../constants/localAuthentication';
import LockIcon from './LockIcon';
import Title from './Title';
import Subtitle from './Subtitle';

const Base = forwardRef(({
	theme, type, onEndProcess, previousPasscode, title, subtitle, onError, showBiometry, onBiometryPress
}, ref) => {
	const rootRef = useRef();
	const dotsRef = useRef();
	const [passcode, setPasscode] = useState('');

	const clearPasscode = () => setPasscode('');

	const wrongPasscode = () => {
		clearPasscode();
		dotsRef?.current?.shake(500);
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
	};

	const animate = (animation, duration = 500) => {
		rootRef?.current?.[animation](duration);
	};

	const onPressNumber = text => setPasscode((p) => {
		const currentPasscode = p + text;
		if (currentPasscode?.length === PASSCODE_LENGTH) {
			switch (type) {
				case TYPE.CHOOSE:
					onEndProcess(currentPasscode);
					break;
				case TYPE.CONFIRM:
					if (currentPasscode !== previousPasscode) {
						onError();
					} else {
						onEndProcess(currentPasscode);
					}
					break;
				case TYPE.ENTER:
					onEndProcess(currentPasscode);
					break;
				default:
					break;
			}
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
		wrongPasscode, animate, clearPasscode
	}));

	return (
		<Animatable.View ref={rootRef} style={styles.container}>
			<Grid style={[styles.grid, { backgroundColor: themes[theme].passcodeBackground }]}>
				<LockIcon theme={theme} />
				<Title text={title} theme={theme} />
				<Subtitle text={subtitle} theme={theme} />
				<Row style={styles.row}>
					<Animatable.View ref={dotsRef}>
						<Dots passcode={passcode} theme={theme} length={PASSCODE_LENGTH} />
					</Animatable.View>
				</Row>
				<Row style={[styles.row, styles.buttonRow]}>
					{_.range(1, 4).map(i => (
						<Col key={i} style={styles.colButton}>
							<Button text={i} theme={theme} onPress={onPressNumber} />
						</Col>
					))}
				</Row>
				<Row style={[styles.row, styles.buttonRow]}>
					{_.range(4, 7).map(i => (
						<Col key={i} style={styles.colButton}>
							<Button text={i} theme={theme} onPress={onPressNumber} />
						</Col>
					))}
				</Row>
				<Row style={[styles.row, styles.buttonRow]}>
					{_.range(7, 10).map(i => (
						<Col key={i} style={styles.colButton}>
							<Button text={i} theme={theme} onPress={onPressNumber} />
						</Col>
					))}
				</Row>
				<Row style={[styles.row, styles.buttonRow]}>
					{showBiometry
						? (
							<Col style={styles.colButton}>
								<Button icon='fingerprint' theme={theme} onPress={onBiometryPress} />
							</Col>
						)
						: <Col style={styles.colButton} />}
					<Col style={styles.colButton}>
						<Button text='0' theme={theme} onPress={onPressNumber} />
					</Col>
					<Col style={styles.colButton}>
						<Button icon='backspace' theme={theme} onPress={onPressDelete} />
					</Col>
				</Row>
			</Grid>
		</Animatable.View>
	);
});

Base.propTypes = {
	theme: PropTypes.string,
	type: PropTypes.string,
	previousPasscode: PropTypes.string,
	title: PropTypes.string,
	subtitle: PropTypes.string,
	showBiometry: PropTypes.string,
	onEndProcess: PropTypes.func,
	onError: PropTypes.func,
	onBiometryPress: PropTypes.func
};

export default Base;
