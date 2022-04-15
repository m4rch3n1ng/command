export default async function get ( options, { keepalive } = {}) {
	process.stdin.on("data", handleSigInt)

	const answers = await _get(options)

	process.stdin.removeListener("data", handleSigInt)
	if (!keepalive) process.stdin.destroy()
	return answers
}

function handleSigInt ( data ) {
	if (encodeURIComponent(data) == "%03") {
		process.stdout.write("\n")
		process.stdout.write("\x1B[?25h")
		process.stdout.clearScreenDown()

		process.exit()
	}
}

async function _get ( options ) {
	if (!Array.isArray(options)) return await _get([ options ])

	let answers = {}
	for (const option of options) {
		switch (option.type) {
			case "input": {
				answers[option.name] = await _getInput(option.prompt, option.default, !!option.required, option.validate)
				break
			}
			case "y/n": {
				answers[option.name] = await _getYesNo(option.prompt, option.default, option.instant)
				break
			}
			case "select": {
				const def = option.select.includes(option.default) ? option.select.indexOf(option.default) : 0
				answers[option.name] = await _getSelect(option.prompt, option.select, def)
				break
			}
			case "multiple": {
				let selected = Array(option.select.length).fill(false)
				if (option.default) selected = option.select.map(( item ) => option.default.includes(item))

				answers[option.name] = await _getMultiple(option.prompt, option.select, selected, option.submit || "select")
				break
			}
		}

		if (option.next && typeof option.next == "object") {
			let nAnswers = null
			if (Array.isArray(option.next)) {
				answers = { ...answers, ...await _get(option.next) }
			} else {
				if (option.type == "multiple") {
					for (const sub of answers[option.name].filter(( el, i, arr ) => arr.indexOf(el) == i)) {
						if (Array.isArray(option.next[sub])) answers = { ...answers, ...await _get(option.next[sub]) }
					}
				} else if (typeof option.next[answers[option.name]] == "object") {
					nAnswers = await _get(option.next[answers[option.name]])
				}
			}

			answers = { ...answers, ...nAnswers }
		}
	}

	return answers
}

async function _getInput ( prompt, def, required, regex ) {
	const { stdin, stdout } = process
	stdin.setRawMode(true)

	prompt = /[^ ]$/.test(prompt) ? `${prompt} ` : prompt

	const toWrite = def ? `${prompt}(${def}) ` : prompt
	stdout.write(toWrite)

	let invalid = false
	let answer = ""

	if (regex) isValid()
	return new Promise(( resolve ) => {
		function line ( data ) {
			const key = encodeURIComponent(data)

			switch (key) {
				case "%08": {
					if (answer.length) {
						stdout.moveCursor(-1)
						stdout.write(" ")
						stdout.moveCursor(-1)

						answer = answer.slice(0, -1)

						if (regex) isValid()
					}

					break
				}
				case "%17": {
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

						if (regex) isValid()
					}

					break
				}
				case "%0D": {
					if (!invalid && (!required || answer.length)) {
						stdout.cursorTo(0)
						stdout.write(Array(toWrite.length + answer.length).fill(" ").join(""))
						stdout.cursorTo(0)

						if (!answer.length) answer = def || ""
						stdout.write(`${prompt}\x1b[33m${answer || ""}\x1b[0m`)

						stdout.write("\n")
						stdin.removeListener("data", line)

						return resolve(answer)
					}

					break
				}
				default: {
					if (/^[-\\/_$@=^?!.:,;#+*|"' \p{L}\d]+$/ui.test(data)) {
					// if (/^[\w\d\-\\/_$@=^?!.:,;#+*|"'üöäßø ]+$/i.test(data)) {
						answer += data
						stdout.write(data)

						if (regex) isValid()
					}

					break
				}
			}
		}

		stdin.on("data", line)
	})

	function isValid () {
		let toVal = answer.length ? answer : def || ""

		if (!regex.test(toVal) && !invalid) {
			invalid = true

			stdout.moveCursor(0, 1)
			stdout.cursorTo(0)

			stdout.write("\x1b[31m>> invalid input\x1b[0m")

			stdout.moveCursor(0, -1)
			stdout.cursorTo(0)

			stdout.write(toWrite)
			stdout.write(answer)
		} else if (regex.test(toVal) && invalid) {
			invalid = false

			stdout.moveCursor(0, 1)
			stdout.cursorTo(0)

			stdout.write(" ".repeat(16))

			stdout.moveCursor(0, -1)
			stdout.cursorTo(0)

			stdout.write(toWrite)
			stdout.write(answer)
		}
	}
}

async function _getYesNo ( prompt, def, instant ) {
	const { stdin, stdout } = process
	stdin.setRawMode(true)

	prompt = /[?!:.]$/.test(prompt) ? `${prompt} ` : `${prompt}: `
	const toWrite = `${prompt}(${def ? "Y/n" : "y/N"}) `
	stdout.write(toWrite)

	let answer = ""
	return new Promise(( resolve ) => {
		function yn ( data ) {
			const key = encodeURIComponent(data)

			if (/^[yn]$/i.test(key)) {
				if (instant) {
					stdout.cursorTo(0)
					stdout.write(Array(toWrite.length).fill(" ").join(""))
					stdout.cursorTo(0)

					stdout.write(`${prompt}\x1b[33m${key.toLowerCase()}\x1b[0m`)

					stdout.write("\n")
					stdin.removeListener("data", yn)

					return resolve(key.toLowerCase() == "y")
				}

				if (answer != key) {
					if (answer.length) stdout.moveCursor(-1)

					answer = key
					stdout.write(key)
				}
			} else if (key == "%08" || key == "%17") {
				if (answer.length) {
					stdout.moveCursor(-1)
					stdout.write(" ")
					stdout.moveCursor(-1)
				}

				answer = ""
			} else if (key == "%0D") {
				stdout.cursorTo(0)
				stdout.write(Array(toWrite.length + 1).fill(" ").join(""))
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

async function _getSelect ( prompt, select, def ) {
	const { stdin, stdout } = process
	stdin.setRawMode(true)
	stdout.write("\x1B[?25l")

	stdout.write(`${prompt}\n`)

	for (const line in select) {
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
			const key = encodeURIComponent(data)

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

				stdout.write(`${/[?:.]$/.test(prompt) ? "" : ":"} \x1b[33m${select[current]}\x1b[0m`)

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

async function _getMultiple ( prompt, select, selected, submit ) {
	const { stdin, stdout } = process

	stdin.setRawMode(true)
	stdout.write("\x1B[?25l")

	let current = -1

	stdout.write(`${prompt}\n`)
	stdout.write(`\x1b[32m>>${submit}<<\x1b[0m\n`)

	for (const line in select) {
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
			const key = encodeURIComponent(data)

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

					const answer = selected.map(( el, i ) => el && select[i]).filter(( el ) => el != false)
					stdout.write(` \x1b[33m${answer.join("\x1b[39m, \x1b[33m")}\x1b[0m`)

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
