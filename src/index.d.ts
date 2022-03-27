type Next = question[] | { [ key: string ]: question }

interface questionInput {
	type: "input",
	name: string,
	prompt: string,
	default?: string,
	validate?: RegExp
	next: Next
}

interface questionYesNo {
	type: "y/n",
	name: string,
	prompt: string,
	default?: boolean,
	instant?: boolean,
	next: Next
}

interface questionSelect {
	type: "select",
	name: string,
	prompt: string,
	select: string[],
	default?: string,
	next: Next
}

interface questionMultiple {
	type: "multiple",
	name: string,
	prompt: string,
	select: string[],
	default?: string[],
	submit?: string,
	next: Next
}

export type question = questionInput | questionYesNo | questionSelect | questionMultiple


interface anyObject {
	[ key: string ]: any
}

interface Command {
	get: ( questions: question ) => {}
	action: ( fn: () => {}) => Command,
	run: ( settings?: { keepalive: boolean } ) => Promise<anyObject>
}

export function command ( questions: question ): Command

export default command
