module.exports = function(grunt) {

    // project configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        
        build_dir: 'build_tmp',
        archive_dir: 'build',
        template_dir: 'template',
        
        clean: {
            build_dir: '<%= build_dir %>',
            build_exe: '<%= pkg.name %>.exe'
        },
        
        exec: { package_source: { cmd: 'pkg .' } },
        
        create_dir: {
            build_dir: ['<%= build_dir %>']
        },
        
        textfile: {
            options: { dest: '<%= build_dir %>' },
            version: {
                options: {
                    template: 'version.tpl',
                    templateDir: '<%= template_dir %>',
                    urlFormat: 'version.txt',
                    customVars: {
                        name: '<%= pkg.name %>',
                        version: '<%= pkg.version %>',
                        description: '<%= pkg.description %>',
                        link: '<%= pkg.homepage %>'
                    }
                }
            }
        },
        
        move: {
            build_exe: {
                src: '<%= pkg.name %>.exe',
                dest: '<%= build_dir %>/<%= pkg.name %>.exe'
            }
        },
        
        copy: {
            main: {
                files: [
                    // include default config file
                    { expand: true, src: ['config/default.json', 'config/rtx-2080-ti.json'], dest: '<%= build_dir %>/', filter: 'isFile' },

                    // include test sample videos
                    { expand: true, src: ['testvids/*'], dest: '<%= build_dir %>/', filter: 'isFile' }
                ]
            }
        },
        
        compress: {
            build: {
                options: { archive: '<%= archive_dir %>/<%= pkg.name %>(v<%= pkg.version %>).zip' },
                files: [{ expand: true, cwd: '<%= build_dir %>/', src: ['**/*'], dest: '/' }]
            }
        },
        
    })
    
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-move');
    grunt.loadNpmTasks('grunt-textfile');
    
    grunt.registerTask('create_dir', 'creates folder(s)', function() {
        var taskName = this.name;
        this.args.forEach(function(arg) {
            var val = grunt.config.get([taskName, arg].join('.'));
            if(Array.isArray(val)) {
                val.forEach(function(dirName) {
                    grunt.file.mkdir(dirName);
                })
            } else {
                grunt.file.mkdir(val);
            }
        });
    });
    
    grunt.registerTask('default', 'packages node source code into a packaged zip containing an exe', function() {
        grunt.task.run([
            'clean:build_dir:build_exe',
            'exec:package_source',
            'create_dir:build_dir',
            'textfile:version',
            'move:build_exe',
            'copy:main',
            'compress:build',
            'clean:build_dir:build_exe',
        ]);
    });
};
