import get from "./get.js"
import { validate } from "./utils.js"

export function command ( object ) {
	let action = null
	let json = object ? validate(object) : null

	const self = Object.freeze({
		get ( object ) {
			json = validate(object)
			return self
		},
		action ( fn ) {
			if (typeof fn == "function") {
				action = fn
				return self
			} else throw new Error("action must be of type function")
		},
		async run ( settings ) {
			if (json) {
				const answers = await get(json, settings)

				if (action) action(answers)
				return answers
			} else throw new Error("cannot run without a given object")
		}
	})

	return self
}

export default command
