module.exports = function(grunt) {
  grunt.initConfig({
    less: {
      production: {
        options: {
          yuicompress: true
        },
        files: {
          'public/css/app.css': 'public/less/app.less'
        }
      }
    },

    requirejs: {
      compile: {
        options: {
          baseUrl: 'public/js',
          name: 'main',
          mainConfigFile: 'public/js/main.js',
          out: "public/js/app.min.js",
          fileExclusionRegExp: /^test$/,
          paths: {
            requireLib: 'lib/require'
          },
          include: ["requireLib"],
          preserveLicenseComments: false
        }
      }
    },

    watch: {
      styles: {
        files: ['public/less/*.less'],
        tasks: ['less'],
        options: {
          spawn: false
        }
      },
      scripts: {
        files: ['public/js/*.js'],
        tasks: ['requirejs'],
        options: {
          spawn: false
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['requirejs', 'less']);
};
