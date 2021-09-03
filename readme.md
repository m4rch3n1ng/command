<!-- omit in toc -->
# @m4rch/command

# about

a small package to handle different types of command line input, especially useful for command-line tools

# table of contents

- [about](#about)
- [table of contents](#table-of-contents)
- [use](#use)
	- [setup](#setup)
	- [functions](#functions)
- [questions](#questions)
	- [input](#input)
	- [y/n](#yn)
	- [select](#select)
	- [multiple](#multiple)

# use

## setup

to use this module you first have to import the module

```js
import command from "@m4rch/command"
```

create an array with objects of `questions` or a single object of `questions`

```js
const questions = [
	// questions go here
]

// or

const questions = {
	// ...questions
}
```

## functions

to add an object of questions you can call the imported directly with the an `questions` object

```js
command(questions)
```

<!-- omit in toc -->
### .get

another way to add an object of questions is via the `.get(questions)`, meaning, that

```js
command()
	.get(questions)
```

is identical to the previous function

<!-- omit in toc -->
### .action

if you _want_ to add a function on what to do, after the answers have been collected, you can use the `.action(fn)` function, for example would

```js
command(questions)
	.action(console.log)
```

simply console log after the answers have been collected

<!-- omit in toc -->
### .run

after adding all the necessary objects you have to call the `.run(options)` function

the function takes a single `options` object

```ts
interface options {
	keepalive?: boolean // whether or not to keep the stdin stream alive after the answers have been collected
}
```

and returns a promise, that will resolve, after all answers have been collected

```js
const answers = await command(questions)
	.run()

console.log(answers)

// does the same as

command(questions)
	.action(console.log)
	.run()
```

# questions

```ts
type questions = question | question[]
```

**every question is an object with fixed properties**

**there are four types of questions**

every question _can_ have the special option `next`

**next:**

the questions that get prompted after the current question was answered 

***

if next is an *object*, the values that get prompted are influenced by the decision on the current question

if you choose, for example, "pizza", then the code will look for an object like the default `questions` array / `questions` object, as a value to the key "pizza". if one is found then these questions will be asked next.

if the type of the last option was "multiple" then for every chosen value will be checked if there is a corresponding array

if none are found then the code will simply skip to the next question in the array or end

***

if next is an *array*, then the code executes similar to if the items were simply put into the array

```ts
type Next = question[] | { [key: string]: questions }
```

**the four types of questions are**

## input

string input

```ts
interface question {
	type: "input",       // type "input"
	name: string,        // key of the returned value in the answers object
	prompt: string,      // the question that is asked
	default?: string,    // the answer if nothing is entered; default: undefined
	validate?: RegExp    // a regex of the required format of the input; default: no validation
	next: Next           // see #next
}
```

## y/n

simple yes or no prompt

```ts
interface question {
	type: "y/n",         // type "y/n"
	name: string,        // key of the returned value in the answers object
	prompt: string,      // the question that is asked
	default?: boolean,   // the answer if nothing is entered; default: false,
	instant?: boolean,   // whether or not it submits instantaneously, when given an option; default: false
	next: Next           // see #next
}
```

## select

select one of the given options

```ts
interface question {
	type: "input",       // type "input"
	name: string,        // key of the returned value in the answers object
	prompt: string,      // the question that is asked
	select: string[],    // the available options to select from
	default?: string,    // the option that gets pre-highlighted on startup; default: this.select[0]
	next: Next
}
```

## multiple

select any amount of the given options

```ts
interface question {
	type: "input",       // type "input"
	name: string,        // key of the returned value in the answers object
	prompt: string,      // the question that is asked
	select: string[],    // the available options to select from
	default?: string[],  // array of answers where
	submit?: string,     // the text on the submit button; default: "select"
	next: Next
}
```
