# Video2x
This tool upscales smaller resolution videoes to a higher resolution based on the [Waifu2x](https://github.com/nagadomi/waifu2x) art upscaler algorithm. It is based off of an [existing python project](https://github.com/K4YT3X/video2x) using the same core principles to perform the video upscale, but with additional functionality to provide less verbouse output and hopefully more meaningful output. It's built to be flexible in terms of what options you pass into either the video encoder (ffmpeg) or the upscaler (waifu2x).

## How it works
1. Extract every frame in the source video.
2. Use waifu2x to upscale the frame to a higher resolution. Many threads of this is run in parallel to split the work.
3. Package the upscaled frames back into a new video, while copying over any audio, subtitle, and attachement streams (if applicable) from the source video.

This is a very process intensive task, so expect to take quite a while (and enough disk space).

## Image comparisons (left side = upscaled, right side = original)

1.
2.
3.

## Requirements
1. [FFmpeg](https://www.ffmpeg.org/). Add the path to the ffmpeg executable into your PATH environment. [Here's instructions on how to do this](https://github.com/adaptlearning/adapt_authoring/wiki/Installing-FFmpeg)
2. Windows executable of the waifu2x tool, [waifu2x-caffe](https://github.com/lltcggie/waifu2x-caffe).
3. [Nodejs](https://nodejs.org/en/) (Optional, only needed if you want to build from source)

## Configuration
You can find configuration files under `config`. The format of the JSON structure is as follows:
```
{
    // workspace folder to temporarily store frames into
    "workDirectory": "temp",

    // new upscaled width and height
    "width": 1920,
    "height": 1080,

    // ffmpeg video encoding (repack to new video) settings
    "ffmpeg": {

        // if you want to use a different encoding library, change this
        "encoderLib": "libx264",

        // as well as providing the option flag you need in addition below
        "encodingOptions": {
            "libx264": [
                ...
            ]
        }
    },

    // waifu2x upscaler options
    "waifu2x": {

        // full path of the waifu2x-caffe-cui executable
        "executablePath": "waifu2x-caffe-cui.exe",

        // you can run waifu2x-caffe-cui in either CPU or GPU mode, this contains common options for both
        "COMMON_PRESET": [
            ...
        ],

        // specific options for CPU/GPU mode
        "CPU_PRESET": [ ... ],
        "GPU_PRESET": [ ... ],

        // Work distribution. You can define as many threads as your PC can support. (For example in my 4 core 1 gpu setup)
        "threads": [
            {
                "type": "gpu",
                // the percentage of frames this thread will process (these should sum up to 1.00)
                "weight": 0.5,
                "preset": "GPU_PRESET"
            },
            {
                "type": "cpu",
                "weight": 0.125,
                "preset": "CPU_PRESET"
            },
            {
                "type": "cpu",
                "weight": 0.125,
                "preset": "CPU_PRESET"
            },
            {
                "type": "cpu",
                "weight": 0.125,
                "preset": "CPU_PRESET"
            },
            {
                "type": "cpu",
                "weight": 0.125,
                "preset": "CPU_PRESET"
            }
        ]
    }
}
```
I encourage you to modify the settings to suit your own needs based on your image perferences and workload distribution.

## Running the executable
asdf todo when released

If you don't care about modifying the code and/or building your own executable from the source, skip the section below.

Building from source (Optional)
===
## Setup (dev)
* Obtain a copy of the source
* Open a terminal and `cd` into the source
* Run `npm install` to obtain node dependencies
* To run, enter `node app.js -i INPUT -o OUTPUT -c CONFIG`, where `INPUT` is the video source file, `OUTPUT` is the name of the new video, and `CONFIG` points to a valid config JSON file (see above).

## Build (dev)
If you want to compile the source yourself to form a standalone executable, do the following:
* Install pkg by running `npm install -g pkg`
* Install grunt by running `npm install -g grunt`
* Grunt tasks are setup already without needing you to configure anything. Build the project by running `grunt`
* Once the task finishes, you can find the packaged project under `.\build`