// https://github.com/RocketChat/Rocket.Chat/blob/0226236b871d12c62338111c70b65d5d406447a3/apps/meteor/lib/getMessageUrlRegex.ts#L1-L2
export const getMessageUrlRegex = (): RegExp =>
	/([A-Za-z]{3,9}):\/\/([-;:&=\+\$,\w]+@{1})?([-A-Za-z0-9\.]+)+:?(\d+)?((\/[-\+=!:~%\/\.@\,\w]*)?\??([-\+=&!:;%@\/\.\,\w]+)?(?:#([^\s\)]+))?)?/g;
