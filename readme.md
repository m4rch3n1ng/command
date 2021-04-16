<!-- omit in toc -->
# @m4rch/command

# about

a small package to handle different types of command line input, especially useful for command-line tools

# table of contents

- [about](#about)
- [table of contents](#table-of-contents)
- [use](#use)
- [options](#options)
	- [type](#type)
	- [name](#name)
	- [prompt](#prompt)
	- [default](#default)
	- [select](#select)
	- [next](#next)
- [examples](#examples)

# use

to use it require the module and extend it as a class, add the property **options** as an array to it, and call the asynchrounous function **get** to get the user input.

```js
const CommandTemplate = require("@m4rch/option")

class Command extends CommandTemplate {
	options = [
		// options here
	]
	async run () {
		let options = await this.get()

		console.log(options)
	}
}

const command = new Command
command.run()

```

the get function returns an object.

# options

**every option is an object with fixed properties**

## type

\--- ***string*** ---  
\--- ***mandatory*** ---

the type of an object determines the way the user inputs the data and the type of data returned

*different input types require some different properties*

- **"input"**

the type "input" is a simple string input

- **"y/n"**

simple yes or no prompt

- **"select"**

for the type "select" input you can choose one of several inputs

- **"multiple"**

the "multiple" type is similar to the "select" type, but allows you to select multiple values

## name

\--- ***string*** ---  
\--- ***mandatory*** ---

the name of the returned value(s) in a key-value pair

## prompt

\--- ***string*** ---  
\--- ***mandatory*** ---

the question that gets prompted when the user has to input the answer

## default

\--- ***string*** ---  
\--- ***optional*** ---  
\--- ***for "input"*** ---

the default option that gets selected when the user doesnt select anything

if not defined the input will default to `undefined`

\--- ***boolean*** ---  
\--- ***optional*** ---  
\--- ***for "y/n"*** ---

the default value of either yes (`true`) or no (`false`)

if not defined the default will be `false`

## select

\--- ***array*** ---  
\--- ***mandatory*** ---  
\--- ***for "multiple", "select"*** ---

an array of values that the user can select from

## next

\--- ***array, object*** ---  
\--- ***optional*** ---  

the questions that get prompted after the current question was answered

if next is an *object*, the values that get prompted are influenced by the decision on the current question

if you decide, for example, for "pizza", then the code will look for an array, just like the default **options** array, as a value to the key "pizza". if one is found then these questions will be asked next. if none are found then the code will simply skip to the next question in the array

if next is an *array*, then the code executes similar to if the items were simply put in the array

# examples

for examples look in the `examples` folder

(more examples may be added some time in the future)
