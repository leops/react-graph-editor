'use strict';

const gulp = require('gulp');
const gulpUtil = require('gulp-util');
const babel = require('gulp-babel');
const del = require('del');
const cleanCSS = require('gulp-clean-css');
const derequire = require('gulp-derequire');
const flatten = require('gulp-flatten');
const runSequence = require('run-sequence');
const through = require('through2');
const webpackStream = require('webpack-stream');

const paths = {
    dist: 'dist',
    lib: 'lib',
    src: [
        'src/**/*.js'
    ],
    css: [
        'src/**/*.css',
    ],
};

const buildDist = opts => {
    const webpackOpts = {
        debug: opts.debug,
        externals: {
            immutable: 'Immutable',
            react: 'React',
            'react-dom': 'ReactDOM',
        },
        module: {
            loaders: [{
                test: /\.css$/,
                loaders: [
                    'style-loader',
                    'css-loader?modules&&localIdentName=__react-graph-editor__[name]__[local]__[hash:base64:5]'
                ]
            }]
        },
        plugins: [
            new webpackStream.webpack.DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify(
                    opts.debug ? 'development' : 'production'
                ),
            }),
            new webpackStream.webpack.optimize.OccurenceOrderPlugin(),
            new webpackStream.webpack.optimize.DedupePlugin(),
        ],
        output: {
            filename: opts.output,
            libraryTarget: 'var',
            library: 'ReactGraph',
        }
    };

    if (!opts.debug) {
        webpackOpts.plugins.push(
            new webpackStream.webpack.optimize.UglifyJsPlugin({
                compress: {
                    screw_ie8: true,
                    warnings: false
                },
            })
        );
    }

    return webpackStream(webpackOpts, null, (err, stats) => {
        if (err) {
            throw new gulpUtil.PluginError('webpack', err);
        }
        if (stats.compilation.errors.length) {
            gulpUtil.log('webpack', '\n' + stats.toString({colors: true}));
        }
    });
};

gulp.task('clean', () =>
     del([paths.dist, paths.lib])
);

gulp.task('modules', () =>
     gulp
        .src(paths.src)
        .pipe(babel())
        .pipe(flatten())
        .pipe(gulp.dest(paths.lib))
);

gulp.task('css', () =>
     gulp
        .src(paths.css)
        .pipe(cleanCSS({
            advanced: false
        }))
        .pipe(gulp.dest(paths.lib))
);

gulp.task('dist', ['modules', 'css'], () =>
    gulp.src('./lib/index.js')
        .pipe(buildDist({
            debug: true,
            output: 'ReactGraph.js',
        }))
        .pipe(derequire())
        .pipe(gulp.dest(paths.dist))
);

gulp.task('dist:min', ['modules'], () =>
    gulp.src('./lib/index.js')
        .pipe(buildDist({
            debug: false,
            output: 'ReactGraph.min.js',
        }))
        .pipe(gulp.dest(paths.dist))
);

gulp.task('watch', () => {
    gulp.watch(paths.src, ['modules']);
});

gulp.task('dev', () => {
    gulp.watch(paths.src, ['modules', 'dist']);
});

gulp.task('default', cb => {
    runSequence('clean', 'modules', ['dist', 'dist:min'], cb);
});
