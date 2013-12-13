/* jshint -W071 */

//
// Gruntfile.js — the config file for grunt
//

'use strict';

var fs = require('fs');
JSON.minify = require('jsonminify');

module.exports = function Gruntfile(grunt) {

    var pkg    = grunt.file.readJSON('package.json');
    var config = grunt.file.readJSON('config.json');

    grunt.initConfig({

        pkg: pkg,

        clean: {
            dir: {
                src: ['build/*']
            },
            sass: {
                src: ['src/static/_css']
            },
            emptydirs: {
                src: ['build/**/*'],
                filter: function(path) {
                    return (grunt.file.isDir(path) && fs.readdirSync(path).length === 0);
                }
            },
            test: {
                src: ['.grunt', '_SpecRunner.html']
            },
            zip: {
                src: ['<%= pkg.name %>.zip']
            }
        },

        watch: {
            scss: {
                files: ['src/static/scss/**/*.scss'],
                tasks: ['sass:dev', 'autoprefixer', 'clean:sass'],
                options: {
                    spawn: false
                }
            }
        },

        sass: {
            dev: {
                options: {
                    style: 'expanded',
                    trace: true
                },
                files: [{
                    expand: true,
                    cwd: 'src/static/scss/',
                    src: ['**/*.scss', '!**/_*.scss'],
                    dest: 'src/static/_css/',
                    ext: '.css'
                }]
            },
            prod: {
                options: {
                    style: 'compressed',
                    noCache: true
                },
                files: [{
                    expand: true,
                    cwd: 'src/static/scss/',
                    src: ['**/*.scss', '!**/_*.scss'],
                    dest: 'src/static/_css/',
                    ext: '.css'
                }]
            }
        },

        autoprefixer: {
            options: {
                browsers: config.server.sassBrowsers
            },
            dist: {
                expand: true,
                flatten: true,
                src: 'src/static/_css/*.css',
                dest: 'src/static/css/'
            }
        },

        csso: {
            options: {
                restructure: false,
                report: 'min'
            },
            dist: {
                files: {
                    'src/static/css/all.css': ['src/static/css/all.css'],
                    'src/static/css/all-oldie.css': ['src/static/css/all-oldie.css'],
                    'src/static/css/docs.css': ['src/static/css/docs.css']
                }
            }
        },

        copy: {
            dist: {
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: [
                        '**',
                        '!**/*.{html,js}',
                        '!**/layout/**',
                        '!**/modules/**',
                        '!**/static/{_css,scss}/**',
                        '!**/static/css/*.map'
                    ],
                    dest: 'build'
                }]
            }
        },

        imagemin: {
            png: {
                options: {
                    optimizationLevel: 7
                },
                files: [
                    {
                        expand: true,
                        cwd: 'src/static/img/',
                        src: ['**/*.png'],
                        dest: 'build/static/img/'
                    }
                ]
            },
            jpg: {
                options: {
                    progressive: true
                },
                files: [
                    {
                        expand: true,
                        cwd: 'src/static/img/',
                        src: ['**/*.jpg'],
                        dest: 'build/static/img/'
                    }
                ]
            }
        },

        uglify: {
            dist: {
                files: [{
                    expand: true,
                    cwd: 'build/',
                    src: ['**/*.js', '!**/js/vendor/**'],
                    dest: 'build/'
                }]
            }
        },

        httpcopy: {
            options: {
                serverUrl: 'http://localhost:' + config.server.port + '/',
                urlMapper: function(serverUrl, filePath) {
                    return serverUrl + filePath.replace(/^src\//, '');
                }
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: ['**/*.{html,js}', '!**/layout/**', '!**/docs/**', '!**/modules/**', '!**/js/**/_*.js', '!**/js/spec/**'],
                    dest: 'build/'
                }]
            }
        },

        jshint: {
            dist: [
                'app.js',
                'gruntfile.js',
                'app/**/*.js',
                'src/static/js/**/*.js',
                grunt.file.read('.jshintignore').trim().split('\n').map(function(s) { return '!' + s; })
            ],
            options: JSON.parse(JSON.minify(fs.readFileSync('.jshintrc', 'utf8')))
        },

        jasmine: {
            dist: {
                src: ['src/static/js/**/_*.js'],
                options: {
                    vendor: 'src/static/js/vendor/*.js',
                    specs: 'src/static/js/spec/*.js'
                }
            }
        },

        compress: {
            dist: {
                options: {
                    archive: '<%= pkg.name %>.zip'
                },
                src: ['build/**']
            }
        },

        'ftp-deploy': {
            dist: {
                auth: {
                    host: config.build.deploy.host,
                    port: config.build.deploy.port,
                    authKey: 'site'
                },
                src: 'build',
                dest: config.build.deploy.dest,
                exclusions: ['**/.DS_Store', '**/Thumbs.db', '**/.gitignore']
            }
        }

    });

    // Load plugins
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-imagemin');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-httpcopy');
    grunt.loadNpmTasks('grunt-ftp-deploy');
    grunt.loadNpmTasks('grunt-autoprefixer');
    grunt.loadNpmTasks('grunt-csso');

    // Default task
    grunt.registerTask('default', [
        'clean:dir',
        'sass:prod',
        'autoprefixer',
        'csso',
        'copy',
        'imagemin',
        'httpcopy',
        'uglify',
        'clean:emptydirs'
    ]);

    // Watch task.
    grunt.registerTask('watcher', [
        'sass:dev',
        'autoprefixer',
        'clean:sass',
        'watch'
    ]);

    // Test task.
    grunt.registerTask('test', [
        'jshint',
        'jasmine',
        'clean:test'
    ]);

    // Zip task.
    grunt.registerTask('zip', [
        'clean:zip',
        'compress'
    ]);

    // Deploy task.
    grunt.registerTask('deploy', [
        'ftp-deploy'
    ]);

};
