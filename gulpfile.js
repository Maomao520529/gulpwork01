var gulp = require('gulp');
const $ = require('gulp-load-plugins')();
var autoprefixer = require('autoprefixer');
var browserSync = require('browser-sync').create();
var minimist = require('minimist');

//minimist, if
var envOptions = {
    string: 'env',
    default: { env: 'develop'}
  };
var options = minimist(process.argv.slice(2), envOptions);
console.log(options)

gulp.task('copyHTML', function() {
    return gulp.src('./source/**/*.html')
    .pipe(gulp.dest('./public/'))
});
//clean
gulp.task('clean', function () {
    return gulp.src(['./public'], {read: false})
      .pipe($.clean());
});
//jade
gulp.task('jade', function() {
    return gulp.src('./source/**/*.jade')
      .pipe($.plumber())
      .pipe($.jade({
        pretty: true //不會壓縮.html檔
      }))
      .pipe(gulp.dest('./public/'))
      .pipe(browserSync.stream());
});
//sass
  gulp.task('sass', function () {
    return gulp.src('./source/stylesheet/**/*.scss')
      .pipe($.plumber())
      .pipe($.sourcemaps.init())
      .pipe($.sass({
          outpuStyle: 'nested',
          includePaths: ['./node_modules/bootstrap/scss']
      })
      .on('error', $.sass.logError))
      //編譯完成 CSS
      .pipe($.postcss([autoprefixer()]))
      .pipe($.if(options.env === 'production', $.cleanCss()))
      .pipe($.sourcemaps.write('.'))
      .pipe(gulp.dest('./public/stylesheet'))
      .pipe(browserSync.stream());
  });
//babel
  gulp.task('babel', () => {
    return gulp.src('./source/javascripts/**/*.js')
      .pipe($.sourcemaps.init())
      .pipe($.babel({
        presets: ['@babel/env']
        }))
      .pipe($.concat('all.js'))
      .pipe(
        $.if(options.env === 'production', $.uglify({
          compress: {
            drop_console: true
          }
        })
      )
    )
      .pipe($.sourcemaps.write('.'))
      .pipe(gulp.dest('./public/javascripts'))
      .pipe(browserSync.stream());
    });
    // vendorJs
    gulp.task('vendorJs', function() {
        return gulp.src([
          './node_modules/jquery/dist/jquery.slim.min.js',
          './node_modules/bootstrap/dist/js/bootstrap.bundle.min.js'
        ])
        .pipe($.concat('vendors.js'))
        .pipe(gulp.dest('./public/javascripts'))
    })
    //browser-sync
    gulp.task('browser-sync', function() {
        browserSync.init({
            server: {
                baseDir: "./public"
            },
            reloadDebounce: 2000
        });
    });
    //imagemin
    gulp.task('imagemin', function () {
        return gulp.src('./source/images/*')
            // .pipe($.imagemin())
            .pipe($.if(options.env === 'production',$.imagemin()))
            .pipe(gulp.dest('./public/images'));
      });
  //watch
  gulp.task('watch', function () {
    gulp.watch('./source/**/*.jade', gulp.series('jade'));
    gulp.watch('./source/stylesheet/**/*.scss', gulp.series('sass'));
    gulp.watch('./source/javascripts/**/*.js', gulp.series('babel'));
});
//gh-pages
gulp.task('deploy', function() {
  return gulp.src('./public/**/*')
    .pipe($.ghPages());
});
  //交付 gulp build  gulp build --env production 輸出時做壓縮
  gulp.task('build', gulp.series('clean',gulp.parallel('jade', 'sass', 'babel'))); // gulp clean 清空  //'browser-sync', 'watch'不用加入
  //一般開發
  gulp.task('default', gulp.parallel('jade', 'sass', 'babel', gulp.series('vendorJs'), 'browser-sync', 'imagemin', 'watch'));
