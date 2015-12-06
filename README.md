# atom-htmltidy

> Beautify HTML using [Tidy-HTML5](http://www.htacg.org/tidy-html5/)


## Install

```
$ apm install atom-htmltidy
```

Or, Settings → Install → Search for `atom-htmltidy`


## Usage

Use Keybinding

```
ctrl-alt-1
```

There's a `Auto Format` option in the settings to activate format on save for html files.

Open the Command Palette and type `atom-htmltidy`.


## Config

Please provide a options for HTML Tidy 5 to format a file.

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

A full list of available Options: [Tidy-HTML5](http://api.html-tidy.org/tidy/quickref_5.1.25.html)

## License

MIT © Andreas Weber

Credits
-------
* [HTML Tidy Library Project](http://tidy.sourceforge.net/)
* [HTML Tidy for HTML5](http://w3c.github.com/tidy-html5/)
* [Lauris Vāvere](https://github.com/vavere/htmltidy)
