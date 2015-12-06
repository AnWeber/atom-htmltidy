# atom-htmltidy

> Beautify HTML using [Tidy-HTML5](http://www.htacg.org/tidy-html5/)


## Install

```
$ apm install atom-htmltidy
```

Or, Settings → Install → Search for `atom-htmltidy`


## Usage

Open the Command Palette and type `atom-htmltidy`.

There's a `Format On Save` option in the settings.


## Config

Go to Settings → Packages → Atom TidyHtml and set Options

```
{
	"indent" : "auto",
	"indent-spaces" : 2,
	"indent-with-tabs": true,
	"wrap" : 72,
	"markup" : true,
	"output-xml" : true,
	"input-xml" : true,
	"show-warnings" : true,
	"numeric-entities" : true,
	"quote-marks" : false,
	"quote-nbsp" : false,
	"quote-ampersand" : false,
	"break-before-br" : false,
	"uppercase-tags" : false,
	"uppercase-attributes" : false,
}
```

Or, set Setting 'File - Enabled' and create a JSON File in the project folder

A full list of available Options: [HTML Tidy 5](http://api.html-tidy.org/tidy/quickref_5.1.25.html)

## License

MIT © [Andreas Wber](weber.andreas@gmail.com)
