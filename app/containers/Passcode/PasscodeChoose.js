import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';

import Base from './Base';
import { TYPE } from './constants';

const PasscodeEnter = ({
	theme, type, finishProcess
}) => {
	const ref = useRef(null);
	const [status, setStatus] = useState(type);
	const [previousPasscode, setPreviouPasscode] = useState(null);

	const firstStep = (p) => {
		setStatus(TYPE.CONFIRM);
		setPreviouPasscode(p);
	};

	const changePasscode = p => finishProcess && finishProcess(p);

	if (status === TYPE.CONFIRM) {
		return <Base ref={ref} theme={theme} type={TYPE.CONFIRM} onEndProcess={changePasscode} previousPasscode={previousPasscode} title='Confirm your new passcode' />;
	}

	return <Base ref={ref} theme={theme} type={TYPE.CHOOSE} onEndProcess={firstStep} title='Choose your new passcode' />;
};

PasscodeEnter.propTypes = {
	theme: PropTypes.string,
	type: PropTypes.string,
	finishProcess: PropTypes.func
};

export default PasscodeEnter;
