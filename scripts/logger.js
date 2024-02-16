/**
 * @typedef {Object} Status - Status color
 * @property {string} SUCCESS - Success color
 * @property {string} INFO - Info color
 * @property {string} ERROR - Error color
 */
const Status = {
	SUCCESS: "hsl(46.61 81.44% 70%)",
	INFO: "hsl(225.94 10.66% 41.72%)",
	ERROR: "hsl(6.5deg 42.05% 70%)",
};

/**
 * @param {Status} status
 * @returns {function}
 */
function log(status) {
	/**
	 * @param  {...string} args
	 * @returns {void}
	 */
	return (...args) => {
		return console.log(
			`%cLegend in the Mist | %c${args.join("\n")}`,
			`font-weight: bold; color: ${status};`,
			"color: hsl(240, 100%, 98%);",
		);
	};
}

/**
 * @param  {...string} args
 * @returns {void}
 * @example
 * error("This is an error message");
 */
export function error(...args) {
	return log(Status.ERROR)(...args);
}

/**
 * @param  {...string} args
 * @returns {void}
 * @example
 * success("This is an error message");
 */
export function success(...args) {
	return log(Status.SUCCESS)(...args);
}

/**
 * @param  {...string} args
 * @returns {void}
 * @example
 * info("This is an info message");
 */
export function info(...args) {
	return log(Status.INFO)(...args);
}
