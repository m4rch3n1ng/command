import { default as get, validate } from "./functions.js"

export default function command () {
	let action = null
	let json = null

	let self = Object.freeze({
		get ( object ) {
			validate(object)
			json = object

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
				let answers = await get(json, settings)

				if (action) action(answers)

				return answers
			} else throw new Error("cannot")
		}
	})

	return self
}
