type Next = question | question[] | { [ key: string ]: question | question[] }

interface questionInput {
	type: "input",
	name: string,
	prompt: string,
	default?: string,
	validate?: RegExp
	next?: Next
}

interface questionYesNo {
	type: "y/n",
	name: string,
	prompt: string,
	default?: boolean,
	instant?: boolean,
	next?: Next
}

interface questionSelect {
	type: "select",
	name: string,
	prompt: string,
	select: string[],
	default?: string,
	next?: Next
}

interface questionMultiple {
	type: "multiple",
	name: string,
	prompt: string,
	select: string[],
	default?: string[],
	submit?: string,
	next?: Next
}

export type question = questionInput | questionYesNo | questionSelect | questionMultiple

export interface answers {
	[ key: string ]: boolean | string | string[]
}

interface Command {
	get: ( questions: question | question[] ) => {}
	action: ( fn: ( answers: answers ) => unknown ) => Command,
	run: ( settings?: { keepalive: boolean } ) => Promise<answers>
}

export function command ( questions: question | question[] ): Command

export default command
