var gulp = require('gulp');
var $    = require('gulp-load-plugins')();
var cleanCSS = require('gulp-clean-css');
var minifyJs = require('gulp-minify');

var sassPaths = [
  'bower_components/foundation-sites/scss',
  'bower_components/motion-ui/src',
  'src/scss/plugin'
];

var minifyCSSOptions = {
  advanced: true,
  rebase:false,
  keepSpecialComments: false
};

gulp.task('sass', function() {
  return gulp.src('src/scss/foundation-datepicker.scss')
    .pipe($.sass({
      includePaths: sassPaths
    })
      .on('error', $.sass.logError))
    .pipe($.autoprefixer({
      browsers: [
        'last 2 versions',
        'ie >= 9',
        'Android >= 2.3'
      ]
    }))
    .pipe(gulp.dest('dist/css/foundation-datepicker.css'));
});

gulp.task('minify-css', function () {
  return gulp.src('dist/css/foundation-datepicker.css')
    .pipe(cleanCSS(minifyCSSOptions))
    .pipe(gulp.dest('dist/css/foundation-datepicker.min.css'));
});

gulp.task('minify-js', function () {
  return gulp.src(['src/js/**/*.js'])
    .pipe(minifyJs({ext:{src:'.js', min:'.min.js'}}))
    .pipe(gulp.dest('dist/js'));
});

gulp.task('default', ['sass', 'concat-js'], function() {
  gulp.watch(['src/scss/**/*.scss'], ['sass']);
  gulp.watch(['src/js/**/*.js'], ['minify-js']);
  gulp.watch(['dist/css/foundation-datepicker.css'], ['minify-css']);
});
