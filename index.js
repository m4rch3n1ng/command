export class CommandTemplate {
	async get ( settings ) {
		this._validate(this.options)

		process.stdin.on("data", ( data ) => {
			if (encodeURIComponent(data) == "%03") {
				process.stdout.write("\n")
				process.stdout.write("\x1B[?25h")
				process.stdout.clearScreenDown()
				
				process.exit()
			}
		})

		let answers = await this._get(this.options)

		if (!settings?.keepalive) process.stdin.destroy()
		return answers
	}

	async _get ( options ) {
		let answers = {}

		for (let option of options) {
			switch (option.type) {
				case "input": {
					answers[option.name] = await this._getInput(option.prompt, option.default)
					break
				}
				case "y/n": {
					answers[option.name] = await this._getYesNo(option.prompt, !!option.default, !!option.instant)
					break
				}
				case "select": {
					let def = option.select.includes(option.default) ? option.select.indexOf(option.default) : 0

					answers[option.name] = await this._getSelect(option.prompt, option.select, def)
					break
				}
				case "multiple": {
					let selected = Array(option.select.length).fill(false)
					if (option.default) selected = option.select.map(( item ) => option.default.includes(item))

					answers[option.name] = await this._getMultiple(option.prompt, option.select, selected, option.submit || "select")
					break
				}
			}

			if (option.next && typeof option.next == "object") {
				let nAnswers = null
				if (Array.isArray(option.next)) {
					answers = { ...answers, ...await this._get(option.next) }
				} else {
					if (option.type == "multiple") {
						for (let sub of answers[option.name].filter(( el, i, arr ) => arr.indexOf(el) == i)) {
							if (Array.isArray(option.next[sub])) answers = { ...answers, ...await this._get(option.next[sub]) }
						}
					} else if (Array.isArray(option.next[answers[option.name]])) {
						nAnswers = await this._get(option.next[answers[option.name]])
					}
				}

				answers = { ...answers, ...nAnswers }
			}
		}

		return answers
	}

	_validate ( options ) {
		if (!Array.isArray(options)) throw new Error(`options has to be of type Array`)

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
					throw new Error(`type must be "multiple", "select" or "input"`)
				}
			}

			if ("next" in option) {
				if (typeof option.next != "object") throw new Error("next must be of type object")

				if (Array.isArray(option.next)) {
					this._validate(option.next)
				} else {
					for (let next in option.next) {
						this._validate(option.next[next])
					}
				}
			}
		})
	}

	async _getInput ( prompt, def ) {
		const { stdin, stdout } = process
		stdin.setRawMode(true)

		prompt = /[\?\:\.]$/.test(prompt) ? `${prompt} ` : `${prompt}: `
		let write = def ? `${prompt}(${def}) ` : `${prompt}`
		stdout.write(write)

		let answer = ""
		return new Promise(( resolve ) => {
			function line ( data ) {
				let key = encodeURIComponent(data)

				if (key == "%20") {

					answer += " "
					stdout.write(" ")

				}
				if (/^[a-zA-Z0-9]$/.test(key)) {

					answer += key
					stdout.write(key)

				} else if (key == "%08") {

					if (answer.length) {
						stdout.moveCursor(-1)
						stdout.write(" ")
						stdout.moveCursor(-1)

						answer = answer.slice(0, -1)
					}

				} else if (key == "%17") {

					if (answer.length) {

						let back = 0
						if (!answer.endsWith(" ")) {
							back = answer.match(/( +)?[^ ]+$/g)[0].length
						} else {
							back = answer.match(/( +)$/)[0].length
						}

						stdout.moveCursor(-back)
						stdout.write(Array(back).fill(" ").join(""))
						stdout.moveCursor(-back)

						answer = answer.slice(0, -back)

					}

				} else if (key == "%0D") {

					stdout.cursorTo(0)
					stdout.write(Array(write.length + answer.length).fill(" ").join(""))
					stdout.cursorTo(0)

					if (!answer.length) answer = def
					stdout.write(`${prompt}\x1b[33m${answer || ""}\x1b[0m`)

					stdout.write("\n")
					stdin.removeListener("data", line)

					resolve(answer)

				}
			}

			stdin.on("data", line)
		})
	}

	async _getYesNo ( prompt, def, instant ) {
		const { stdin, stdout } = process
		stdin.setRawMode(true)

		prompt = /[?!:.]$/.test(prompt) ? `${prompt} ` : `${prompt}: `
		let write = `${prompt}(${def ? "Y/n" : "y/N"}) `
		stdout.write(write)

		let answer = ""
		return new Promise(( resolve ) => {
			function yn ( data ) {
				let key = encodeURIComponent(data)

				if (/^[yn]$/i.test(key)) {

					if (instant) {
						stdout.cursorTo(0)
						stdout.write(Array(write.length).fill(" ").join(""))
						stdout.cursorTo(0)

						stdout.write(`${prompt}\x1b[33m${key.toLowerCase()}\x1b[0m`)

						stdout.write("\n")
						stdin.removeListener("data", yn)

						return resolve(key.toLowerCase() == "y")
					}

					if (answer.length) stdout.moveCursor(-1)

					answer = key
					stdout.write(key)

				} else if (key == "%08" || key == "%17") {

					if (answer.length) {
						stdout.moveCursor(-1)
						stdout.write(" ")
						stdout.moveCursor(-1)
					}

					answer = ""

				} else if (key == "%0D") {

					stdout.cursorTo(0)
					stdout.write(Array(write.length + 1).fill(" ").join(""))
					stdout.cursorTo(0)

					stdout.write(`${prompt}\x1b[33m${answer.length ? answer.toLowerCase() : def ? "y": "n" }\x1b[0m`)

					stdout.write("\n")
					stdin.removeListener("data", yn)

					resolve(answer.length ? answer.toLowerCase() == "y" : def)

				}
			}

			stdin.on("data", yn)
		})
	}

	async _getSelect ( prompt, select, def ) {
		const { stdin, stdout } = process
		stdin.setRawMode(true)
		stdout.write("\x1B[?25l")

		stdout.write(`${prompt}\n`)

		for (let line in select) {
			stdout.write(`  ${select[line]}\n`)
		}

		stdout.moveCursor(0, -select.length)
		stdout.cursorTo(0)

		let current = def
		stdout.moveCursor(0, current)

		stdout.write(`\x1b[36m> ${select[current]}\x1b[0m`)
		stdout.cursorTo(0)

		return await new Promise(( resolve ) => {
			function multiple ( data ) {
				let key = encodeURIComponent(data)

				if (key == "%1B%5BA") {

					stdout.write(`\x1b[0m  ${select[current]}`)
					stdout.cursorTo(0)

					if (current == 0) {
						current = select.length - 1
						stdout.moveCursor(0, select.length - 1)
					} else {
						current--
						stdout.moveCursor(0, -1)
					}

					stdout.cursorTo(0)
					stdout.write(`\x1b[36m> ${select[current]}`)
					stdout.cursorTo(0)

				} else if (key == "%1B%5BB") {

					stdout.write(`\x1b[0m  ${select[current]}`)
					stdout.cursorTo(0)

					if (current == select.length - 1) {
						current = 0
						stdout.moveCursor(0, -(select.length - 1))
					} else {
						current++
						stdout.moveCursor(0, 1)
					}

					stdout.cursorTo(0)
					stdout.write(`\x1b[36m> ${select[current]}`)
					stdout.cursorTo(0)

				} else if (key == "%0D") {

					stdout.moveCursor(0, -select.length + (select.length - current))
					stdout.clearScreenDown()
					stdout.write("\x1b[0m")

					stdout.moveCursor(0, -1)
					stdout.cursorTo(prompt.length)

					stdout.write(`${/[\?\:\.]$/.test(prompt) ? "" : ":"} \x1b[33m${select[current]}\x1b[0m`)

					stdout.cursorTo(0)
					stdout.moveCursor(0, 1)
					stdout.write("\x1B[?25h")

					stdin.removeListener("data", multiple)

					resolve(select[current])

				}
			}

			stdin.on("data", multiple)
		})
	}

	async _getMultiple ( prompt, select, selected, submit ) {
		const { stdin, stdout } = process

		stdin.setRawMode(true)
		stdout.write("\x1B[?25l")

		let current = -1

		stdout.write(`${prompt}\n`)
		stdout.write(`\x1b[32m>>${submit}<<\x1b[0m\n`)

		for (let line in select) {
			if (selected[line]) {
				stdout.write(`\x1b[33m>\x1b[0m ${select[line]}\n`)
			} else {
				stdout.write(`  ${select[line]}\n`)
			}
		}

		stdout.moveCursor(0, -select.length - 1)
		stdout.cursorTo(0)

		return new Promise(( resolve ) => {
			function multiple ( data ) {
				let key = encodeURIComponent(data)

				if (key == "%1B%5BA") {

					if (current == -1) {
						stdout.write(`\x1b[32m  ${submit}  \x1b[0m`)
					} else {
						if (selected[current]) {
							stdout.write(`\x1b[33m> \x1b[0m${select[current]}`)
						} else {
							stdout.write(`\x1b[0m  ${select[current]}`)
						}
					}

					stdout.cursorTo(0)

					if (current == -1) {
						current = select.length - 1
						stdout.moveCursor(0, select.length)
					} else {
						current--
						stdout.moveCursor(0, -1)
					}

					stdout.cursorTo(0)

					if (current == -1) {
						stdout.write(`\x1b[32m>>${submit}<<\x1b[0m`)
					} else {
						if (selected[current]) {
							stdout.write(`\x1b[33m> \x1b[36m${select[current]}\x1b[0m`)
						} else {
							stdout.write(`\x1b[36m> ${select[current]}\x1b[0m`)
						}
					}

					stdout.cursorTo(0)

				} else if (key == "%1B%5BB") {

					if (current == -1) {
						stdout.write(`\x1b[32m  ${submit}  \x1b[0m`)
					} else {
						if (selected[current]) {
							stdout.write(`\x1b[33m> \x1b[0m${select[current]}`)
						} else {
							stdout.write(`\x1b[0m  ${select[current]}`)
						}
					}

					stdout.cursorTo(0)

					if (current == select.length - 1) {
						current = -1
						stdout.moveCursor(0, -select.length)
					} else {
						current++
						stdout.moveCursor(0, 1)
					}

					stdout.cursorTo(0)

					if (current == -1) {
						stdout.write(`\x1b[32m>>${submit}<<\x1b[0m`)
					} else {
						if (selected[current]) {
							stdout.write(`\x1b[33m> \x1b[36m${select[current]}\x1b[0m`)
						} else {
							stdout.write(`\x1b[36m> ${select[current]}\x1b[0m`)
						}
					}

					stdout.cursorTo(0)

				} else if (key == "%0D") {

					if (current == -1) {
						stdout.cursorTo(0)
						stdout.clearScreenDown()

						stdout.moveCursor(0, -1)
						stdout.cursorTo(prompt.length)

						let answer = selected.map(( el, i ) => el && select[i]).filter(( el ) => el != false)
						stdout.write(` \x1b[33m${answer.join(", ")}\x1b[0m`)

						stdout.cursorTo(0)
						stdout.moveCursor(0, 1)
						stdout.write("\x1B[?25h")
	
						stdin.removeListener("data", multiple)

						return resolve(answer)
					}

					selected[current] = !selected[current]

					if (selected[current]) {
						stdout.write(`\x1b[33m> \x1b[36m${select[current]}\x1b[0m`)
					} else {
						stdout.write(`\x1b[36m> ${select[current]}\x1b[0m`)
					}

					stdout.cursorTo(0)

				}
			}

			stdin.on("data", multiple)
		})
	}
}

export default CommandTemplate
