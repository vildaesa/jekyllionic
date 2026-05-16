const { src, dest, watch, series } = require('gulp')
const cleanCss = require('gulp-clean-css')
const sass = require('gulp-sass')(require('sass'))
const rename = require('gulp-rename')

function buildStyles() {
    return src('_sass/**/*.scss')
        .pipe(sass({
            includePaths: ['./node_modules'],
        }).on('error', sass.logError))
        .pipe(cleanCss())
        .pipe(rename('main.css'))
        .pipe(dest('assets/css'))
}

function watchTask() {
    watch(['_sass/**/*.scss', '!assets/css/**'], buildStyles)
}

exports.default = series(buildStyles, watchTask)
