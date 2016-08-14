"use strict";

const gulp = require('gulp');
const nodemon = require('gulp-nodemon');
const livereload = require('gulp-livereload');

gulp.task('default', () => {
	livereload.listen();
	nodemon({
		script: 'app.js',
		ext: 'js'
	}).on('restart', () => {
		gulp.src('app.js')
			.pipe(livereload());
	});
});