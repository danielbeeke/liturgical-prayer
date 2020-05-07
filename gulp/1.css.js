'use strict';

const rhythmmeister = require('./rhythmmeister.js');
const gulp = require('gulp');
const autoPrefixer = require('autoprefixer');
const sass = require('gulp-sass');
const path = require('path');
const postcss = require('gulp-postcss');
const sassGlob = require('gulp-sass-glob');

gulp.task('css', function () {
    let fontPresets = rhythmmeister.load(path.resolve('./font-presets.json'));
    let processors = [
        rhythmmeister.processor(fontPresets),
        autoPrefixer({ cascade: false })
    ];
    return gulp.src('scss/styles.scss')
    .pipe(sassGlob())
    .pipe(sass())
    .pipe(postcss(processors))
    .pipe(gulp.dest('public/css'))
    .pipe(stream());
});