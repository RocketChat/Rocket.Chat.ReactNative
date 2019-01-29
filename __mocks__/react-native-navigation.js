class Events {
	registerAppLaunchedListener = () => {}
}
const events = new Events();
class NavigationClass {
	registerComponent = () => {}

	setRoot = () => {}

	events = () => events
}

const Navigation = new NavigationClass();

export {
	Navigation
};
