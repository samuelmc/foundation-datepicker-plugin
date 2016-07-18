var gulp        = require('gulp');
var plugins     = require('gulp-load-plugins')();
var minifyCss   = require('gulp-mini-css');
var uglify      = require('uglify-js-harmony');
var minifyJs    = require('gulp-uglify/minifier');
var rename      = require('gulp-rename');

var sassPaths   = [
  'bower_components/foundation-sites/scss',
  'bower_components/motion-ui/src',
  'src/scss/plugin'
];

gulp.task('sass', function() {
  return gulp.src('src/scss/foundation-datepicker.scss')
    .pipe(plugins.sass({
      includePaths: sassPaths
    })
      .on('error', plugins.sass.logError))
    .pipe(plugins.autoprefixer({
      browsers: [
        'last 2 versions',
        'ie >= 9',
        'Android >= 2.3'
      ]
    }))
    .pipe(gulp.dest('dist/css'));
});

gulp.task('minify-css', function () {
  return gulp.src('dist/css/foundation-datepicker.css')
      .pipe(minifyCss({ext: '.min.css'}))
      .pipe(gulp.dest('dist/css'));
});

gulp.task('minify-js', function () {
  return gulp.src('src/js/**/*.js')
      .pipe(minifyJs({}, uglify))
      .pipe(rename({suffix: '.min'}))
      .pipe(gulp.dest('dist/js'));
});

gulp.task('copy-js', function () {
  return gulp.src('src/js/**/*.js')
      .pipe(plugins.copy('dist/js', {prefix: 2}));
});


gulp.task('default', ['sass','minify-css','copy-js','minify-js'], function() {
  gulp.watch(['src/scss/**/*.scss'], ['sass']);
  gulp.watch(['dist/css/foundation-datepicker.css'], ['minify-css']);
  gulp.watch(['src/js/**/*.js'], ['copy-js','minify-js']);
});
