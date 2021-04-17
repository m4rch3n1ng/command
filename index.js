class CommandTemplate {
	async get ( settings ) {
		this._validate(this.options)

		if (!Array.isArray(this.options)) return {}

		process.stdin.on("data", ( data ) => {
			if (encodeURIComponent(data) == "%03") {
				process.stdout.write("\n")
				process.stdout.write("\x1B[?25h")
				
				process.exit()
			}
		})

		let answers = await this._get(this.options, settings)

		if (!settings?.keepalive) process.stdin.destroy()
		return answers
	}

	async _get ( options, settings ) {
		let answers = {}

		for (let option of options) {
			switch (option.type) {
				case "input": {
					answers[option.name] = await this._getInput(option.prompt, option.default)
					break
				}
				case "y/n": {
					answers[option.name] = await this._getYesNo(option.prompt, !!option.default)
					break
				}
				case "select": {
					answers[option.name] = await this._getSelect(option.prompt, option.select)
					break
				}
				case "multiple": {
					answers[option.name] = await this._getMultiple(option.prompt, option.select)
					break
				}
			}

			if (option.next && typeof option.next == "object") {
				let nAnswers = null
				if (Array.isArray(option.next)) {
					nAnswers = await this._get(option.next)
				} else if (Array.isArray(option.next[answers[option.name]])) {
					nAnswers = await this._get(option.next[answers[option.name]])
				}

				answers = { ...answers, ...nAnswers }
			}
		}

		return answers
	}

	_validate ( options ) {
		if (!Array.isArray(options)) throw new Error("options has to be of type Array")

		options.forEach(( option ) => {
			if (typeof option.name != "string") throw new Error("name must be of type string")
			if (typeof option.type != "string") throw new Error("type must be of type string")
			if (typeof option.prompt != "string") throw new Error("prompt must be of type string")

			if (![ "input", "y/n", "select", "multiple" ].includes(option.type)) throw new Error(`type must be "multiple", "select" or "input"`)

			if ((option.type == "multiple" || option.type == "select") && !Array.isArray(option.select)) {
				throw new Error(`select must be of type Array, if type is set to ${option.type}`)
			}

			if (option.next) {
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

	async _getYesNo ( prompt, def ) {
		const { stdin, stdout } = process
		stdin.setRawMode(true)

		prompt = /[\?\:\.]$/.test(prompt) ? `${prompt} ` : `${prompt}: `
		let write = `${prompt}(${def ? "Y/n" : "y/N"}) `
		stdout.write(write)

		let answer = ""
		return new Promise(( resolve ) => {
			function yn ( data ) {
				let key = encodeURIComponent(data)

				if (/^[yn]$/i.test(key)) {

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
					stdout.write(Array(write.length + answer.length).fill(" ").join(""))
					stdout.cursorTo(0)

					stdout.write(`${prompt}\x1b[33m${answer.length ? answer : def ? "y": "n" }\x1b[0m`)

					stdout.write("\n")
					stdin.removeListener("data", yn)

					resolve(answer.length ? answer.toLowerCase() == "y" : def)

				}
			}

			stdin.on("data", yn)
		})
	}

	async _getSelect ( prompt, select ) {
		const { stdin, stdout } = process
		stdin.setRawMode(true)
		stdout.write("\x1B[?25l")

		let current = 0
		stdout.write(`${prompt}\n`)

		for (let line in select) {
			stdout.write(`  ${select[line]}\n`)
		}

		stdout.moveCursor(0, -select.length)
		stdout.cursorTo(0)
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

	async _getMultiple ( prompt, select ) {
		const { stdin, stdout } = process
		stdin.setRawMode(true)
		stdout.write("\x1B[?25l")

		let current = 0
		let selected = []

		stdout.write(`${prompt}\n`)

		for (let line in select) {
			selected[line] = false
			stdout.write(`  ${select[line]}\n`)
		}
		stdout.write(`\x1b[32m  submit  \x1b[0m\n`)

		stdout.moveCursor(0, -select.length - 1)
		stdout.cursorTo(0)
		stdout.write(`\x1b[36m> ${select[current]}\x1b[0m`)
		stdout.cursorTo(0)

		return new Promise(( resolve ) => {
			function multiple ( data ) {
				let key = encodeURIComponent(data)

				if (key == "%1B%5BA") {

					if (current == select.length) {
						stdout.write("\x1b[32m  submit  \x1b[0m")
					} else {
						if (selected[current]) {
							stdout.write(`\x1b[33m> \x1b[0m${select[current]}`)
						} else {
							stdout.write(`\x1b[0m  ${select[current]}`)
						}
					}

					stdout.cursorTo(0)

					if (current == 0) {
						current = select.length
						stdout.moveCursor(0, select.length)
					} else {
						current--
						stdout.moveCursor(0, -1)
					}

					stdout.cursorTo(0)

					if (current == select.length) {
						stdout.write("\x1b[32m>>submit<<\x1b[0m")
					} else {
						if (selected[current]) {
							stdout.write(`\x1b[33m> \x1b[36m${select[current]}\x1b[0m`)
						} else {
							stdout.write(`\x1b[36m> ${select[current]}\x1b[0m`)
						}
					}

					stdout.cursorTo(0)

				} else if (key == "%1B%5BB") {

					if (current == select.length) {
						stdout.write("\x1b[32m  submit  \x1b[0m")
					} else {
						if (selected[current]) {
							stdout.write(`\x1b[33m> \x1b[0m${select[current]}`)
						} else {
							stdout.write(`\x1b[0m  ${select[current]}`)
						}
					}

					stdout.cursorTo(0)

					if (current == select.length) {
						current = 0
						stdout.moveCursor(0, -select.length)
					} else {
						current++
						stdout.moveCursor(0, 1)
					}

					stdout.cursorTo(0)

					if (current == select.length) {
						stdout.write("\x1b[32m>>submit<<\x1b[0m")
					} else {
						if (selected[current]) {
							stdout.write(`\x1b[33m> \x1b[36m${select[current]}\x1b[0m`)
						} else {
							stdout.write(`\x1b[36m> ${select[current]}\x1b[0m`)
						}
					}

					stdout.cursorTo(0)

				} else if (key == "%0D") {

					if (current == select.length) {
						stdout.moveCursor(0, -select.length)
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

module.exports = CommandTemplate
