var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var livereload = require('gulp-livereload');
 
gulp.task('default', function() {
	livereload.listen();	// listen for changes
	nodemon({	// configure nodemon
		script: 'app.js',
		ext: 'js'
	}).on('restart', function(){
		// when the app has restarted, run livereload.
		gulp.src('app.js')
			.pipe(livereload());
	});
});