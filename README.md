# foundation-datepicker-plugin
**Datepicker plugin for Foundation 6 front end framework**

## Installation

**With bower:**
```shell
bower install --save foundation-datepicker-plugin
```
Add all nessesary files to your html. This plugin only works with foundation and requires momnetjs, mustache.js and either font-awesome or foundation-icons.
```html
<link rel="stylesheet" type="text/css" href="bower_components/foundation-sites/dist/foundation.min.css"> 
<link rel="stylesheet" type="text/css" href="bower_components/foundation-datepicker-plugin/dist/css/foundation-datepicker.min.css"> 
<link rel="stylesheet" type="text/css" href="bower_components/font-awesome/css/font-awesome.min.css">
...
<script src="bower_components/jquery/dist/jquery.min.js"></script>
<script src="bower_components/mustache.js/mustache.min.js"></script>
<script src="bower_components/moment/min/moment-with-locales.min.js"></script>
<script src="bower_components/foundation-sites/dist/foundation.min.js"></script>
<script src="bower_components/foundation-datepicker-plugin/dist/js/foundation.datepicker.min.js"></script>
```

If you are using foundation's scss with gulp, the best way add the styles is by adding it to the sass paths in your gulpfile.
```js
var gulp = require('gulp');
var $    = require('gulp-load-plugins')();

var sassPaths = [
  'bower_components/foundation-sites/scss',
  'bower_components/foundation-datepicker-plugin/src/scss/plugin',
  'bower_components/motion-ui/src',
  'bower_components/fontawesome/scss'
];

gulp.task('sass', function() {
    ...

```
Then add these settings to your _settings.scss file for customization
```scss
$datepicker-background: $body-background;
$datepicker-font-color: $body-font-color;
$datepicker-disabled-color: #ccc;
$datepicker-disabled-background: #ddd;
$datepicker-other-month-color: #ccc;
$datepicker-other-month-background: #ddd;
$datepicker-same-month-color: $datepicker-font-color;
$datepicker-same-month-background: #bbb;
$datepicker-today-color: $datepicker-font-color;
$datepicker-today-background: #78b8e8;
$datepicker-current-color: $datepicker-font-color;
$datepicker-current-background: $primary-color;
$datepicker-padding: 0;
$datepicker-border: 1px solid $medium-gray;
$datepicker-font-size: 1rem;
$datepicker-width: rem-calc(300);
$datepicker-radius: $global-radius;
$datepicker-sizes: (
        tiny: rem-calc(100),
        small: rem-calc(200),
        large: rem-calc(400),
);
```

## Usage
**Basic html**
```html
<input type="text" data-datepicker>
```

**European format**
```html
<input type="text" data-datepicker data-format="DD/MM/YYYY" data-weekstart="1">
```

Run foundation and it will automaticaly initialize all the datepickers
```js
$(document).foundation();
```

**Plugin options**

|Name     |Default  |Descrition|
|---------|---------|----------|
|data-v-offset|0|Number of pixels between the dropdown pane and the triggering element on open.|
|data-h-offset|0|Number of pixels between the dropdown pane and the triggering element on open.|
|data-position-class|top|Class applied to adjust open position. JS will test and fill this in.|
|data-close-on-click|true|Allows a click on the body to close the dropdown.|
|data-format|YYYY-MM-DD|The date format. See [momentjs formatting](http://momentjs.com/docs/#/parsing/string-format/)|
|data-locale|en|Sets the language for the month- and weekday names|
|data-weekstart|0|Starting day of the week: 0 = Sunday, 1 = Monday,  ...|
## Licence
[![MIT Licence](https://img.shields.io/badge/Licence-MIT-blue.svg)](https://opensource.org/licenses/mit-license.php)

&copy; Samuel Moncarey

[![Donate via paypal](https://img.shields.io/badge/Paypal-donate-blue.svg)](https://www.paypal.me/samuelmc/10 "Consider donation")
