'use strict';

const gulp = require('gulp');
const autoPrefixer = require('gulp-autoprefixer');
const sass = require('gulp-sass');
const sassGlob = require('gulp-sass-glob');

gulp.task('css', function () {
    return gulp.src('scss/styles.scss')
    .pipe(sassGlob())
    .pipe(sass())
    .pipe(autoPrefixer({
        browsers: ['last 4 versions'],
        cascade: false
    }))
    .pipe(gulp.dest('public/css'))
    .pipe(stream());
});