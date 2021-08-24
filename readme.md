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
	- [instant](#instant)
	- [submit](#submit)
	- [next](#next)

# use

<!-- to use it require the module and extend it as a class, add the property **options** as an array to it, and call the asynchrounous function **get** to get the user input. -->
to use it import the module

```js
import command from "@m4rch/command"
```

create an array with objects of `options` or a single object of `options`

```js
const options = [
	// options go here
]

// or

const options = {
	// ...options
}
```

and then call the imported function with the `options` (or add it via the `.get()` function), _optionally_ add an action via the `.action()` command on what to do, when the answers are in, and then call the asynchronous `.run()`, which returns the answers as well as call the action

```js
const answers = await command(options)
	.action(console.log)
	.run()

// or

const answers = await command()
	.get(options)
	.action(console.log)
	.run()
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

\--- ***string, boolean, array*** ---  
\--- ***optional*** ---  
\--- ***for "input", "y/n", "multiple"*** ---

the default option that gets selected when the user doesnt select anything

if not defined the input will default to `undefined`, `false` or `[]` respectively

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

## instant

\--- ***boolean*** ---  
\--- ***optional*** ---  
\--- ***for "y/n"*** ---

whether or not the user has to type enter to submit or if it submits instantaneously

## submit

\--- ***string*** ---  
\--- ***optional*** ---  
\--- ***for "multiple"*** ---

a string that determines the name of the "submit" button

## next

\--- ***array, object*** ---  
\--- ***optional*** ---  

the questions that get prompted after the current question was answered

***

if next is an *object*, the values that get prompted are influenced by the decision on the current question

if you choose, for example, "pizza", then the code will look for an object like the default `options` array / `options` object, as a value to the key "pizza". if one is found then these questions will be asked next.

if the type of the last option was "multiple" then for every chosen value will be checked if there is a corresponding array

if none are found then the code will simply skip to the next question in the array or end

***

if next is an *array*, then the code executes similar to if the items were simply put into the array
