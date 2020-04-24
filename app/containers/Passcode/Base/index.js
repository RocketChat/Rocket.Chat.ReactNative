import React, {
	useState, forwardRef, useImperativeHandle, useRef
} from 'react';
import { View, Text } from 'react-native';
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

const Base = forwardRef(({
	theme, type, onEndProcess, previousPasscode, title, subtitle, onError
}, ref) => {
	const rootRef = useRef();
	const dotsRef = useRef();
	const [passcode, setPasscode] = useState('');

	const wrongPasscode = () => {
		setPasscode('');
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
		wrongPasscode, animate
	}));

	return (
		<Animatable.View ref={rootRef} style={styles.container}>
			<View style={styles.container}>
				<View style={styles.viewTitle}>
					<Text style={[styles.textTitle, { color: themes[theme].titleText }]}>{title}</Text>
					{subtitle ? <Text style={[styles.textSubtitle, { color: themes[theme].bodyText }]}>{subtitle}</Text> : null}
				</View>
				<Animatable.View ref={dotsRef} style={styles.flexCirclePasscode}>
					<Dots passcode={passcode} theme={theme} length={PASSCODE_LENGTH} />
				</Animatable.View>
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
							<Button del theme={theme} onPress={onPressDelete} />
						</Col>
					</Row>
				</Grid>
			</View>
		</Animatable.View>
	);
});

Base.propTypes = {
	theme: PropTypes.string,
	type: PropTypes.string,
	previousPasscode: PropTypes.string,
	title: PropTypes.string,
	subtitle: PropTypes.string,
	onEndProcess: PropTypes.func,
	onError: PropTypes.func
};

export default Base;
