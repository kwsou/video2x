const execFile = require('child_process').execFile,
    ffmpegCommand = require('fluent-ffmpeg'),
    fs = require('fs-extra'),
    path = require('path'),
    printf = require('printf'),
    Q = require('q');

const cutils = require('./console-utils');

var performStep = function(stepPurpose, callback, callbackArgsArray) {
    var d = Q.defer();

    cutils.enterStep(stepPurpose);
    var loadTimer = cutils.startLoadAnimation();
    callback.apply(null, callbackArgsArray).then(function(payload) {
        cutils.stopLoadAnimation(loadTimer);
        cutils.exitStep();
        d.resolve(payload);
    }, function(err) {
        d.reject(err);
    });

    return d.promise;
};

var extractPNGFromSourceVideo = function(ffmpegSettings, sourcePathname, destPath, filePattern) {
    var d = Q.defer();
    ffmpegCommand()
        .addInput(sourcePathname)
        .output(path.join(destPath, filePattern))
        .withOption('-threads', ffmpegSettings.numThreads || 0)
        .on('start', function(commandLine) {
            cutils.printCLI(commandLine);
        })
        .on('error', function(err, stdout, stderr) {
            d.reject(err);
        })
        .on('end', function() {
            d.resolve();
        })
        .run()
    ;
    return d.promise;
};

var combinePNGToNewVideo = function(metadata, ffmpegSettings, sourcePathname, framesPathname, destPathname) {
    var d = Q.defer();

    var videoSettings = [
        '-map 0:v',
        printf('%s %s', '-vcodec', ffmpegSettings.encoderLib)
    ];
    ffmpegSettings.encodingOptions[ffmpegSettings.encoderLib].forEach(function(arg) {
        videoSettings.push(printf('%s %s', arg.flag, '' + arg.value));
    });

    ffmpegCommand()
        // first input: upscaled frames
        .input(framesPathname)
        .inputFps(metadata.stream.avg_frame_rate)
        .inputFormat('image2')
        // second input: original source (to copy over all non-video streams)
        .input(sourcePathname)
        // preserve all metadata information on the global level from second input
        .withOption('-map_metadata 1')
        .outputOptions(videoSettings)
        .withOption('-threads', ffmpegSettings.numThreads || 0)
        // preserve all audio, subtitle, and attachment streams from original source
        .outputOptions([ '-map 1:a', '-acodec copy', '-map 1:s?', '-map 1:t?' ])
        .output(destPathname)
        .on('start', function(commandLine) {
            cutils.printCLI(commandLine);
        })
        .on('error', function(err, stdout, stderr) {
            d.reject(stderr);
        })
        .on('end', function() {
            d.resolve();
        })
        .run()
    ;
    return d.promise;
};

var getVideoMetadata = function(file) {
    var d = Q.defer();

    cutils.printCLI(printf('ffprobe -of json -show_streams -show_format "%s"', file));
    ffmpegCommand.ffprobe(file, function(err, data) {
        if(err || !data) {
            d.reject(err || 'Input file is not valid');
            return;
        }

        var result = {
            format: data.format
        };
        
        // find the first video stream out of all available streams in metadata
        for(var i = 0; i < data.streams.length; i++) {
            if(data.streams[i].codec_type == 'video') {
                result.stream = data.streams[i];
                break;
            }
        }
        d.resolve(result);
    });

    return d.promise;
};

var spawnWaifu2x = function(id, baseDirectory, waifu2xStaticArgs, newWidth, newHeight, originalFramePath, newFramePath, modelDirectory) {
    var d = Q.defer();

    var waifu2xCUIPath = path.join(baseDirectory, 'waifu2x-caffe-cui.exe');
    var args = [];
    [
        {
            'flag': '-i',
            'value': originalFramePath
        },
        {
            'flag': '-o',
            'value': newFramePath
        },
        {
            'flag': '-w',
            'value': newWidth
        },
        {
            'flag': '-h',
            'value': newHeight
        },
        {
            'flag': '--model_dir',
            'value': path.join(baseDirectory, modelDirectory)
        }
    ].concat(waifu2xStaticArgs).map(function(arg) {
        args.push(printf('%s %s', arg.flag, '' + arg.value));
    });

    cutils.printCLI(printf('%s %s', waifu2xCUIPath, args.join(' ')));
    const WHITE_SPACE = ' ';
    if(originalFramePath.indexOf(WHITE_SPACE) >= 0 || newFramePath.indexOf(WHITE_SPACE) >= 0) {
        d.reject('waifu2xCUI does not like spaces in the input/output path');
        return d.promise;
    }

    execFile(waifu2xCUIPath, args, function(err, stdout, stderr) {
        if(err || stderr) {
            d.reject(err || stderr);
            return;
        }
        d.resolve(id);
    });

    return d.promise;
};

// calculate total size of frames folder (1 level deep)
var getDirectorySize = function(dirPath) {
    var d = Q.defer();

    var results = {
        totalSize: 0,
        files: []
    };

    fs.readdir(dirPath).then(function(files) {
        var statsDeferred = [];

        results.files = files;
        for(var i = 0; i < files.length; i++) {
            statsDeferred.push(fs.stat(path.join(dirPath, files[i])));
        }

        Q.allSettled(statsDeferred).then(function(stats) {
            stats.forEach(function(stat) {
                if(!stat.value.isDirectory()) {
                    results.totalSize += stat.value.size;
                }
            });
            d.resolve(results);
        }, d.reject);
    }, d.reject)

    return d.promise;
};

var timeDiffMins = function(startTime) {
    return Math.abs(Date.now() - startTime) / (1000 * 60);
};

var timeDiffHrs = function(startTime) {
    return Math.abs(Date.now() - startTime) / (1000 * 60 * 60);
};

exports.performStep = performStep;
exports.extractPNGFromSourceVideo = extractPNGFromSourceVideo;
exports.combinePNGToNewVideo = combinePNGToNewVideo;
exports.getVideoMetadata = getVideoMetadata;
exports.spawnWaifu2x = spawnWaifu2x;
exports.getDirectorySize = getDirectorySize;
exports.timeDiffMins = timeDiffMins;
exports.timeDiffHrs = timeDiffHrs;