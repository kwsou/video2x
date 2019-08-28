const argv = require('minimist')(process.argv.slice(2)),
    fs = require('fs-extra'),
    path = require('path'),
    Q = require('q'),
    printf = require('printf'),
    uuidv1 = require('uuid/v1');

const cutils = require('./lib/console-utils'),
    utils = require('./lib/utils');

var showBanner = function() {
    console.log('    #    # # #####  ######  ####   #####  #    #   ');
    console.log('    #    # # #    # #      #    # #     #  #  #    ');
    console.log('    #    # # #    # #####  #    #       #   ##     ');
    console.log('    #    # # #    # #      #    #  #####    ##     ');
    console.log('     #  #  # #    # #      #    # #        #  #    ');
    console.log('      ##   # #####  ######  ####  ####### #    #   ');
    console.log('                                                   ');
};

var getRequiredArgument = function(argName) {
    if(argv[argName]) {
        return argv[argName];
    } else {
        console.log(printf('Error: missing argument "%s"', argName));
        process.exit(-1);
    }
};

var initConfig = function() {
    var deferred = Q.defer();
    var configPath = argv.c ? argv.c : './config/default.json';
    
    utils.performStep(printf('Reading config file in "%s"', configPath), fs.readJson, [configPath]).then(function(config) {
        // attach argument values into config
        config.input = getRequiredArgument('i');
        config.output = argv.o ? argv.o : null;
        if(!config.output) {
            const FILE_EXTENSION = path.extname(config.input);
            config.output = printf('%s_new%s', path.basename(config.input, FILE_EXTENSION), FILE_EXTENSION);
        }

        deferred.resolve(config);
    }, cutils.showError);
    return deferred.promise;
};

var start = function(config) {
    // ensure workspace directory is a completly new directory
    const WORK_DIRECTORY = path.join(config.workDirectory, uuidv1()),
        EXTRACTED_FRAMES_DIRECTORY = path.join(WORK_DIRECTORY, 'extracted'),
        UPSCALED_FRAMES_DIRECTORY = path.join(WORK_DIRECTORY, 'upscaled'),
        FRAME_FILE_PATTERN = 'frame%d.png';
    
    var startTime = Date.now();
    var metadata, originalFrameSize, upscaledFrameSize;
    utils.performStep('Retrieving video metadata', function() {
        return utils.getVideoMetadata(config.input);
    }).then(function(data) {
        metadata = data;
        return utils.performStep(printf('Creating new workspace directory: %s', WORK_DIRECTORY), fs.emptyDir, [WORK_DIRECTORY]);
    }).then(function() {
        return utils.performStep(printf('Creating directory under workspace to store extracted frames: %s', EXTRACTED_FRAMES_DIRECTORY), fs.emptyDir, [EXTRACTED_FRAMES_DIRECTORY]);
    }).then(function() {
        return utils.performStep(printf('Creating directory under workspace to store upscaled frames: %s', UPSCALED_FRAMES_DIRECTORY), fs.emptyDir, [UPSCALED_FRAMES_DIRECTORY]);
    }).then(function() {
        return utils.performStep('Extracting frames from source video', function() {
            var d = Q.defer();

            var startTime = Date.now();
            utils.extractPNGFromSourceVideo(config.ffmpeg, config.input, EXTRACTED_FRAMES_DIRECTORY, FRAME_FILE_PATTERN).then(function() {
                // show statistics
                utils.getDirectorySize(EXTRACTED_FRAMES_DIRECTORY).then(function(dirInfo) {
                    originalFrameSize = dirInfo.totalSize / (1024 * 1024 * 1024);
                    cutils.stepComment(printf('Extracted %i frames from "%s" (Size: %0.2f GB, Time: %0.2f hours, approx. %0.0f minutes)', dirInfo.files.length, config.input, originalFrameSize, utils.timeDiffHrs(startTime), utils.timeDiffMins(startTime)));
                    d.resolve(dirInfo.files);
                }, d.reject);
            }, d.reject);

            return d.promise;
        });
    }).then(function(extractedFrames) {
        var oldResolution = printf('%ix%i', metadata.stream.width, metadata.stream.height);
        var newResolution = printf('%ix%i', config.width, config.height);
        return utils.performStep(printf('Upscaling the extracted frames from %s to %s', oldResolution, newResolution), function() {
            var d = Q.defer();

            utils.performStep('Splitting up the frames into smaller groups, each to be processed by its own waifu2x thread', function() {
                var startTime = Date.now();
                var waifu2xThreads = [], currFrameIndex = 0, totalFrames = extractedFrames.length;
                for(var i = 0; i < config.waifu2x.threads.length; i++) {
                    var currThread = config.waifu2x.threads[i];
                    var threadNum = i + 1;
                    var totalFramesHandled = Math.floor(totalFrames * currThread.weight);
    
                    if(i < config.waifu2x.threads.length - 1) {
                        cutils.stepComment(printf('[Thread%i] %i (%.1f%) frames - %s mode', threadNum, totalFramesHandled, currThread.weight * 100, currThread.type));
                    } else {
                        totalFramesHandled = totalFrames - currFrameIndex;
                        cutils.stepComment(printf('[Thread%i] %i (%.1f%) frames - %s mode', threadNum, totalFramesHandled, (totalFramesHandled / totalFrames) * 100, currThread.type));
                    }
    
                    var currThreadWorkspace = path.join(EXTRACTED_FRAMES_DIRECTORY, 'thread' + threadNum);
                    fs.emptyDirSync(currThreadWorkspace);
                    for(var k = 0; k < totalFramesHandled; k++) {
                        var frameIndex = currFrameIndex + k;
                        fs.moveSync(path.join(EXTRACTED_FRAMES_DIRECTORY, extractedFrames[frameIndex]), path.join(currThreadWorkspace, extractedFrames[frameIndex]));
                    }
                    currFrameIndex += totalFramesHandled;
    
                    var newWaifu2xThread = utils.spawnWaifu2x(threadNum, config.waifu2x.directory, config.waifu2x[currThread.preset].concat(config.waifu2x.COMMON_PRESET), config.width, config.height, currThreadWorkspace, UPSCALED_FRAMES_DIRECTORY, config.waifu2x.model);
                    newWaifu2xThread.done(function(threadId) {
                        cutils.stepComment(printf('[Thread%i] Completed in %0.2f hours (approx. %0.0f minutes)', threadId, utils.timeDiffHrs(startTime), utils.timeDiffMins(startTime)));
                    });
                    waifu2xThreads.push(newWaifu2xThread);
                }
                
                // just add a line break to make it easier to see
                cutils.stepComment('');
                return Q.allSettled(waifu2xThreads);
            }).then(function() {
                // show statistics
                utils.getDirectorySize(UPSCALED_FRAMES_DIRECTORY).then(function(dirInfo) {
                    upscaledFrameSize = dirInfo.totalSize / (1024 * 1024 * 1024);
                    cutils.stepComment(printf('All waifu2x threads successfully finished. Upscaled %i frames (Size: %0.2f GB, %0.2fx the original size)', dirInfo.files.length, upscaledFrameSize, upscaledFrameSize / originalFrameSize));
                    d.resolve();
                }), d.reject;
            });

            return d.promise;
        });
    }).then(function() {
        return utils.performStep('Converting upscaled frames to new video', function() {
            var d = Q.defer();

            var startTime = Date.now();
            utils.combinePNGToNewVideo(metadata, config.ffmpeg, config.input, path.join(UPSCALED_FRAMES_DIRECTORY, FRAME_FILE_PATTERN), config.output).then(function() {
                var originalVideoSize = (fs.statSync(config.input).size) / (1024 * 1024 * 1024);
                var newVideoSize = (fs.statSync(config.output).size) / (1024 * 1024 * 1024);
                cutils.stepComment(printf('New video created "%s" (Size: %0.2f GB, %0.2fx the original size, Time: %0.2f hours, approx. %0.0f minutes)', config.output, newVideoSize, newVideoSize / originalVideoSize, utils.timeDiffHrs(startTime), utils.timeDiffMins(startTime)));
                d.resolve();
            }, d.reject);

            return d.promise;
        });
    }).then(function() {
        return utils.performStep(printf('Cleaning up workspace directory: %s', WORK_DIRECTORY), fs.remove, [WORK_DIRECTORY]);
    }).then(function() {
        cutils.stepComment(printf('Video2x successfully finished all tasks in %0.2f hours', utils.timeDiffHrs(startTime)));
        process.exit(0);
    }).catch(cutils.showError);
};

// start
showBanner();
initConfig().done(function(config) {
    start(config);
});