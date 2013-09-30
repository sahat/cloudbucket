module.exports = function(grunt) {
  grunt.initConfig({
//    less: {
//      development: {
//        options: {
//          concat: false
//        },
//        files: [
//          {
//            expand: true,
//            concat: false,
//            cwd: 'src/less',
//            src: ['*.less'],
//            dest: 'build/css',
//            ext: '.css'
//          }
//        ]
//      }
//    },

    requirejs: {
      compile: {
        options: {
          baseUrl: 'public/js',
          name: 'main',
          dir: 'release',
          mainConfigFile: 'public/js/main.js',
          fileExclusionRegExp: /^test$/
        }
      }
    }
//    watch: {
//      scripts: {
//        files: ['src/coffee/**/*.coffee'],
//        tasks: ['coffee'],
//        options: {
//          spawn: false
//        }
//      },
//      styles: {
//        files: ['src/less/**/*.less'],
//        tasks: ['less'],
//        options: {
//          spawn: false
//        }
//      }
//    }
  });
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['requirejs']);
};
