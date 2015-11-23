module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    karma: {
      unit: {
        configFile: 'karma.conf.js',
        singleRun: true
      }
    },
    copy: {
      imgs: {
        expand: true,
        src: 'imgs/*.*',
        dest: 'dist/'
      }
    },
    concat: {
      options: {
        separator: ';',
      },
      js: {
        src: [
          'ts_output_readonly_do_NOT_change_manually/src/gameLogic.js',
          'ts_output_readonly_do_NOT_change_manually/src/game.js',
          'ts_output_readonly_do_NOT_change_manually/src/aiService.js'],
        dest: 'dist/js/everything.js',
      },
      css: {
        src: 'css/*.css',
        dest: 'dist/css/everything.min.css', // It will be minified by postcss, which overwrites the file.
      },
    },
    postcss: {
     options: {
       map: {
         inline: false, // save all sourcemaps as separate files...
         annotation: 'dist/css/maps/' // ...to the specified directory
       },
       processors: [
         require('autoprefixer')(), // add vendor prefixes
         require('cssnano')() // minify the result
       ]
     },
     dist: {
       src: 'dist/css/everything.min.css'
     }
   },
    uglify: {
      options: {
        sourceMap: true,
      },
      my_target: {
        files: {
          'dist/everything.min.js': ['dist/everything.js']
        }
      }
    },
    processhtml: {
      dist: {
        files: {
          'dist/index.min.html': ['index.html']
        }
      }
    },
    manifest: {
      generate: {
        options: {
          basePath: '.',
          cache: [
            'http://ajax.googleapis.com/ajax/libs/angularjs/1.3.8/angular.min.js',
            'http://ajax.googleapis.com/ajax/libs/angularjs/1.3.8/angular-touch.min.js',
            'http://cdnjs.cloudflare.com/ajax/libs/angular-ui-bootstrap/0.12.1/ui-bootstrap-tpls.min.js',
            'http://maxcdn.bootstrapcdn.com/bootstrap/3.3.1/css/bootstrap.min.css',
            'http://maxcdn.bootstrapcdn.com/bootstrap/3.3.1/fonts/glyphicons-halflings-regular.woff',
            'http://maxcdn.bootstrapcdn.com/bootstrap/3.3.1/fonts/glyphicons-halflings-regular.ttf',
            'http://yoav-zibin.github.io/emulator/dist/turnBasedServices.3.min.js',
            'http://yoav-zibin.github.io/emulator/main.css',
            'dist/everything.min.js',
            'css/everything.min.css',
            'imgs/HelpSlide1.png',
            'imgs/HelpSlide2.png',
            'imgs/HelpSlide3.png',
            'imgs/HelpSlide4.png',
            'imgs/HelpSlide5.png',
            'imgs/dominoes/domino-0-0.svg',
            'imgs/dominoes/domino-0-1.svg',
            'imgs/dominoes/domino-0-2.svg',
            'imgs/dominoes/domino-0-3.svg',
            'imgs/dominoes/domino-0-4.svg',
            'imgs/dominoes/domino-0-5.svg',
            'imgs/dominoes/domino-0-6.svg',
            'imgs/dominoes/domino-1-1.svg',
            'imgs/dominoes/domino-1-2.svg',
            'imgs/dominoes/domino-1-3.svg',
            'imgs/dominoes/domino-1-4.svg',
            'imgs/dominoes/domino-1-5.svg',
            'imgs/dominoes/domino-1-6.svg',
            'imgs/dominoes/domino-2-2.svg',
            'imgs/dominoes/domino-2-3.svg',
            'imgs/dominoes/domino-2-4.svg',
            'imgs/dominoes/domino-2-5.svg',
            'imgs/dominoes/domino-2-6.svg',
            'imgs/dominoes/domino-3-3.svg',
            'imgs/dominoes/domino-3-4.svg',
            'imgs/dominoes/domino-3-5.svg',
            'imgs/dominoes/domino-3-6.svg',
            'imgs/dominoes/domino-4-4.svg',
            'imgs/dominoes/domino-4-5.svg',
            'imgs/dominoes/domino-4-6.svg',
            'imgs/dominoes/domino-5-5.svg',
            'imgs/dominoes/domino-5-6.svg',
            'imgs/dominoes/domino-6-6.svg',
            'imgs/dominoes/domino-blank.svg',
            'imgs/player/image0.svg',
            'imgs/player/image1.svg'
          ],
          network: [
            'js/everything.min.js.map',
            'js/everything.js'
          ],
          timestamp: true
        },
        dest: 'dist/index.min.appcache',
        src: []
      }
    },
    'http-server': {
        'dev': {
            // the server root directory
            root: '.',
            port: 9000,
            host: "0.0.0.0",
            cache: 1,
            showDir : true,
            autoIndex: true,
            // server default file extension
            ext: "html",
            // run in parallel with other tasks
            runInBackground: true
        }
    },
    protractor: {
      options: {
        configFile: "protractor.conf.js", // Default config file
        keepAlive: true, // If false, the grunt process stops when the test fails.
        noColor: false, // If true, protractor will not use colors in its output.
        args: {
          // Arguments passed to the command
        }
      },
      all: {}
    },
  });

  require('load-grunt-tasks')(grunt);

  // Default task(s).
  grunt.registerTask('default', [
      'karma',
      'copy',
      'concat', 'postcss', 'uglify',
      'processhtml', 'manifest',
      'http-server', 'protractor']);

};
