# changelog

all notable changes to this project will be documented in this file.

the format is loosely based on [keep a changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [semantic versioning](https://semver.org/spec/v2.0.0.html).

## [unreleased]

## [0.4.0] - 2021-09-03

### added

- input: added validate option

### changed

- complete overhaul of the readme.md
- changed changelog.md
- input: removed `case "%20%` and moved adding spaces to default case
- `todo` => `todo.md`

## [0.3.0] - 2021-08-24

### added

- added support for non-array options
- input: added support for _, =, ?, |, *, ", '

### changed

- `let` -> `const`
- y/n: stopped replacing letter when pressed again

### removed

- removed examples
- removed unnecessary escapes

### fixed

- fixed outdated readme.md

## [0.2.2] - 2021-08-07

### added

- input: support for ä, ö, ü, ß and ø
- input: added support for pasting

### changed

- will now remove listener on finish

## [0.2.1] - 2021-06-19

### added

- added support for passing option directly to command()

### changed


- moved some functions
- renamed some files

## [0.2.0] - 2021-06-14

### changed

- full overhaul of the system
- class -> function

### removed

- class system

## [0.1.7] - 2021-05-19

### added

- select: added default
- added changelog

### changed

- reverted prefix of internal functions to _
- changed type to es module

## [0.1.6] - 2021-05-16

### changed

- multiple: changed default submit button to select

### fixed

- y/n: selection will be correctly displayed if instant is set

## [0.1.5] - 2021-05-09

### added

- y/n: added instant option
- multiple: added default option

### changed

- changed prefix of internal functions from _ to $

## [0.1.4] - 2021-04-27

### added

- multiple: .next support

## [0.1.3] - 2021-04-23

### added

- multiple: added customizability to "submit" button

### changed

- multiple: pushed "submit" button to the top

## [0.1.2] - 2021-04-16

### fixed

- y/n: answer gets properly deleted

## [0.1.1] - 2021-04-16

### added

- y/n option
- control backspace to delete whole word

## [0.1.0] - 2021-04-16

### added

- initial release
