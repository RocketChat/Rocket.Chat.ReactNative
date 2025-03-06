export const formatTime = function (time: number) {
	const minutes = Math.floor(time / 60);
	const seconds = time % 60;
	const min = minutes < 10 ? `0${minutes}` : minutes;
	const sec = seconds < 10 ? `0${seconds}` : seconds;
	return `${min}:${sec}`;
};
