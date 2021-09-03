export function validate ( options ) {
	if (!Array.isArray(options)) {
		validate([ options ])
		return options
	}

	options.forEach(( option ) => {
		if (typeof option.name != "string") throw new Error("name must be of type string")
		if (typeof option.type != "string") throw new Error("type must be of type string")
		if (typeof option.prompt != "string") throw new Error("prompt must be of type string")

		if ((option.type == "multiple" || option.type == "select") && !Array.isArray(option.select)) {
			throw new Error(`select must be of type Array, if type is set to ${option.type}`)
		}

		switch (option.type) {
			case "input": {
				if ("default" in option && typeof option.default != "string") throw new Error("default must be of type string if type is set to \"input\"")
				if ("validate" in option && !(option.validate instanceof RegExp)) throw new Error("validate must be a regular expression if type is set to \"input\"")
				break
			}
			case "y/n": {
				if ("default" in option && typeof option.default != "boolean") throw new Error("default must be of type boolean if type is set to \"y/n\"")
				if ("instant" in option && typeof option.instant != "boolean") throw new Error("instant must be of type boolean if type is set to \"y/n\"")
				break
			}
			case "select": {
				if (!Array.isArray(option.select)) throw new Error("select must be of type array if type is set to select")
				if (!option.select.length) throw new Error("select cannot be empty if type is set to select")
				if ("default" in option && typeof option.default != "string") throw new Error("default must be of type string if type is set to \"select\"")
				break
			}
			case "multiple": {
				if (!Array.isArray(option.select)) throw new Error("select must be of type array if type is set to multiple")
				if (!option.select.length) throw new Error("select cannot be empty if type is set to multiple")
				if ("submit" in option && typeof option.submit != "string") throw new Error("submit must be of type string if type is set to \"submit\"")
				if ("default" in option && !Array.isArray(option.default)) throw new Error("default must be of type array if type is set to \"multiple\"")
				break
			}
			default: {
				throw new Error("type must be \"multiple\", \"y/n\", \"select\" or \"input\"")
			}
		}

		if ("next" in option) {
			if (typeof option.next != "object") throw new Error("next must be of type object")

			if (Array.isArray(option.next)) {
				validate(option.next)
			} else {
				for (const next in option.next) {
					validate(option.next[next])
				}
			}
		}
	})

	return options
}
