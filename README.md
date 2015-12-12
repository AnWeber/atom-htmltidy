# atom-htmltidy

Beautify HTML using [Tidy-HTML5](http://www.htacg.org/tidy-html5/)

## Install

```
$ apm install atom-htmltidy
```

Or, Settings → Install → Search for `atom-htmltidy`


## Usage

use Keybinding `ctrl-alt-1`

There's a `format on save` option in the settings to activate format on save for html files.

Open the Command Palette and type `atom-htmltidy`.


## Settings

* **dynamic new-blocklevel-tags**:
all tags with an - in the tag name are added to the tidy html 5 option new-blocklevel-tags, e.g. angular js bootstrap 'uib-alert'
*default: disabled*
* **dynamic show-body-only**:
the html tidy 5 option is set to true, if a body tag exists
*default: disabled*
* **format on save**:
auto format html document on save
*default: enabled*
* **enable file search**:
the options for tidy html 5 is loaded from a json file
*default: enabled*
* **filename of tidy html 5 options**:
name of the tidy html 5 options file
*default: .htmltidy*
* **default options**:
if no tidy html 5 options file is found, this options will be used
*default: none*
* **warn on tag count change**:
if the tag count change during formatting, a warn notification gets displayed. tidy html 5 automatically delete or add html tags. it is a feature.
*default: disabled*
* **path to tidy executable**:
the package has a builtin version of tidy html 5 (v5.1.25). if you want to use a newer version, this is your setting.
*default: none*

Please provide tidy html 5 options. I don't recommend using empty options. I use this options in an angularjs project.
```
{

	"markup" : true,
	"output-xml" : false,
	"input-xml" : true,
	"show-warnings" : true,
	"numeric-entities" : false,
	"quote-marks" : false,
	"quote-nbsp" : true,
	"quote-ampersand" : false,
	"break-before-br" : false,
	"preserve-entities" : true,
	"uppercase-tags" : false,
	"uppercase-attributes" : false,
	"indent" : "auto",
	"indent-with-tabs" : false,
	"indent-attributes" : true,
	"sort-attributes" : "alpha",
	"wrap" : 200
}

```

A full list of available Options: [Tidy-HTML5](http://api.html-tidy.org/tidy/quickref_5.1.25.html)

## License

MIT © Andreas Weber

Credits
-------
* [HTML Tidy Library Project](http://tidy.sourceforge.net/)
* [Tidy-HTML5](http://www.htacg.org/tidy-html5/)
