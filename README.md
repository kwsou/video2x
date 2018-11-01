# Video2x
This tool upscales smaller resolution videoes to a higher resolution based on the [Waifu2x](https://github.com/nagadomi/waifu2x) art upscaler algorithm. It is based off of an [existing python project](https://github.com/K4YT3X/video2x) using the same core principles to perform the video upscale, but with additional functionality to provide less verbouse output and hopefully more meaningful output. It's built to be flexible in terms of what options you pass into either the video encoder (ffmpeg) or the upscaler (waifu2x).

Get latest release [here](https://github.com/kwsou/video2x/releases).

## How it works
1. Extract every frame in the source video.
2. Use waifu2x to upscale the frame to a higher resolution. Many threads of this is run in parallel to split the work.
3. Package the upscaled frames back into a new video, while copying over any audio, subtitle, and attachement streams (if applicable) from the source video.

This is a very process intensive task, so expect to take quite a while (and enough disk space).

## Image comparisons (left side = upscaled, right side = original)
1. Encoded as H264 (preset=slow, crt=18) and Waifu2x (Magnify and denoise, level 1):

![screenshot](https://github.com/kwsou/video2x/blob/master/image-comparisons/sample1.png)

![screenshot](https://github.com/kwsou/video2x/blob/master/image-comparisons/sample2.png)

![screenshot](https://github.com/kwsou/video2x/blob/master/image-comparisons/sample3.png)

![screenshot](https://github.com/kwsou/video2x/blob/master/image-comparisons/sample4.png)

![screenshot](https://github.com/kwsou/video2x/blob/master/image-comparisons/sample5.png)

![screenshot](https://github.com/kwsou/video2x/blob/master/image-comparisons/sample6.png)

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

        // Work distribution. You can define as many threads as your PC can support. (ex. for 4 cores + 1 gpu)
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
I encourage you to modify the settings to suit your own needs based on your image perferences and workload distribution. You can look at other available [ffmpeg video encoders](https://www.ffmpeg.org/ffmpeg-codecs.html#Video-Encoders) and see available [waifu2x-caffe-cui options](https://github.com/kwsou/video2x/blob/master/docs/waifu2x-caffe-cui.md).

## Running the executable
* Open a command prompt and `cd` where the executable is located
* enter `video2x.exe -i INPUT -o OUTPUT -c CONFIG`, where `INPUT` is the video source file, `OUTPUT` is the name of the new video, and `CONFIG` points to a valid config JSON file (see above). For example,
    ```
    video2x.exe -i "C:\videos\video1.mp4" -o "C:\videos\new_video1.mp4" -c "config\default.json"
    ```

Sample output
===
```
C:\dev\video2x\build\video2x(v1.0.0)>video2x.exe -i testvids\30-second-sample-Inuyasha.mkv -c config\custom.json
    #    # # #####  ######  ####   #####  #    #
    #    # # #    # #      #    # #     #  #  #
    #    # # #    # #####  #    #       #   ##
    #    # # #    # #      #    #  #####    ##
     #  #  # #    # #      #    # #        #  #
      ##   # #####  ######  ####  ####### #    #

Reading config file in "config\custom.json"
Retrieving video metadata
    Command: ffprobe -of json -show_streams -show_format "testvids\30-second-sample-Inuyasha.mkv"
Creating new workspace directory: D:\test\3ca00a20-dd9f-11e8-af5d-e906be9beccf
Creating directory under workspace to store extracted frames: D:\test\3ca00a20-dd9f-11e8-af5d-e906be9beccf\extracted
Creating directory under workspace to store upscaled frames: D:\test\3ca00a20-dd9f-11e8-af5d-e906be9beccf\upscaled
Extracting frames from source video
    Command: ffmpeg -i testvids\30-second-sample-Inuyasha.mkv -y D:\test\3ca00a20-dd9f-11e8-af5d-e906be9beccf\extracted\frame%d.png
    Extracted 718 frames from "testvids\30-second-sample-Inuyasha.mkv" (Size: 0.28 GB, Time: 0.00 hours, approx. 0 minutes)
Upscaling the extracted frames from 640x480 to 2560x1440
    Splitting up the frames into smaller groups, each to be processed by its own waifu2x thread
        [Thread1] 359 (50.0%) frames - gpu mode
        Command: C:/dev/waifu2x-caffe/waifu2x-caffe-cui.exe -i D:\test\3ca00a20-dd9f-11e8-af5d-e906be9beccf\extracted\thread1 -o D:\test\3ca00a20-dd9f-11e8-af5d-e906be9beccf\upscaled -w 2560 -h 1440 -p gpu --gpu 0 -b 15 -c 256 -e png -m noise_scale -n 1
        [Thread2] 89 (12.5%) frames - cpu mode
        Command: C:/dev/waifu2x-caffe/waifu2x-caffe-cui.exe -i D:\test\3ca00a20-dd9f-11e8-af5d-e906be9beccf\extracted\thread2 -o D:\test\3ca00a20-dd9f-11e8-af5d-e906be9beccf\upscaled -w 2560 -h 1440 -e png -m noise_scale -n 1
        [Thread3] 89 (12.5%) frames - cpu mode
        Command: C:/dev/waifu2x-caffe/waifu2x-caffe-cui.exe -i D:\test\3ca00a20-dd9f-11e8-af5d-e906be9beccf\extracted\thread3 -o D:\test\3ca00a20-dd9f-11e8-af5d-e906be9beccf\upscaled -w 2560 -h 1440 -e png -m noise_scale -n 1
        [Thread4] 89 (12.5%) frames - cpu mode
        Command: C:/dev/waifu2x-caffe/waifu2x-caffe-cui.exe -i D:\test\3ca00a20-dd9f-11e8-af5d-e906be9beccf\extracted\thread4 -o D:\test\3ca00a20-dd9f-11e8-af5d-e906be9beccf\upscaled -w 2560 -h 1440 -e png -m noise_scale -n 1
        [Thread5] 92 (12.8%) frames - cpu mode
        Command: C:/dev/waifu2x-caffe/waifu2x-caffe-cui.exe -i D:\test\3ca00a20-dd9f-11e8-af5d-e906be9beccf\extracted\thread5 -o D:\test\3ca00a20-dd9f-11e8-af5d-e906be9beccf\upscaled -w 2560 -h 1440 -e png -m noise_scale -n 1

        [Thread4] Completed in 0.07 hours (approx. 4 minutes)
        [Thread3] Completed in 0.07 hours (approx. 4 minutes)
        [Thread2] Completed in 0.07 hours (approx. 4 minutes)
        [Thread5] Completed in 0.07 hours (approx. 4 minutes)
        [Thread1] Completed in 0.08 hours (approx. 5 minutes)
    All waifu2x threads successfully finished. Upscaled 718 frames (Size: 1.80 GB, 6.38x the original size)
Converting upscaled frames to new video
    Command: ffmpeg -r 24000/1001 -f image2 -i D:\test\3ca00a20-dd9f-11e8-af5d-e906be9beccf\upscaled\frame%d.png -i testvids\30-second-sample-Inuyasha.mkv -y -map_metadata 1 -map 0:v -vcodec libx264 -preset slow -crf 18 -pix_fmt yuv420p -map 1:a -acodec copy -map 1:s? -map 1:t? 30-second-sample-Inuyasha_new.mkv
    New video created "30-second-sample-Inuyasha_new.mkv" (Size: 0.04 GB, 4.23x the original size, Time: 0.02 hours, approx. 1 minutes)
Cleaning up workspace directory: D:\test\3ca00a20-dd9f-11e8-af5d-e906be9beccf
Video2x successfully finished all tasks in 0.10 hours
```

Building from source (Optional)
===
If you don't care about modifying the code and/or building your own executable from the source, skip the section below.
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
