# Video2x
This tool upscales smaller resolution videoes to a higher resolution based on the [Waifu2x](https://github.com/nagadomi/waifu2x) art upscaler algorithm. It is based off of an [existing python project](https://github.com/K4YT3X/video2x) using the same core principles to perform the video upscale, but with additional functionality to provide less verbouse output and hopefully more meaningful output. It's built to be flexible in terms of what options you pass into either the video encoder (ffmpeg) or the upscaler (waifu2x).

This project is in github! You can find the page [here](https://github.com/kwsou/video2x). You can also grab the latest release [here](https://github.com/kwsou/video2x/releases).

## How it works
1. Extract every frame in the source video.
2. Use waifu2x to upscale the frame to a higher resolution. Many threads of this is run in parallel to split the work.
3. Package the upscaled frames back into a new video, while copying over any audio, subtitle, and attachement streams (if applicable) from the source video.

This is a very process intensive task, so expect to take quite a while (and enough disk space).

## Image comparisons
Visit this [link](https://video2x.kwsou.com/image-comparison/) to see my compiled list of screenshot comparisons.

## Requirements
1. [FFmpeg](https://www.ffmpeg.org/). Add the path to the ffmpeg executable into your PATH environment. [Here's instructions on how to do this](https://github.com/adaptlearning/adapt_authoring/wiki/Installing-FFmpeg)
2. Windows executable of the waifu2x tool, [waifu2x-caffe](https://github.com/lltcggie/waifu2x-caffe).
3. [Nodejs](https://nodejs.org/en/) (Optional, only needed if you want to build from source)

## Optional
1. I highly recommend the [NVIDIA CUDA Deep Neural Network](https://developer.nvidia.com/cudnn) (cuDNN) library when using waifu2x-caffe. This is a high-speed machine learning library that **can only be used with NVIDIA GPUs**. Compared to using your cpu or gpu (via CUDA) to upscale images, cuDNN offers the following advantages:

    - Depending on the type of GPU used, images can be converted faster (exponentially faster in my experience)
    - VRAM usage can be reduced

    Due to licensing issues, waifu2x-caffe does not include this library by default. Here are instructions on how to obtain this library and have waifu2x-caffe use it:
    - Visit the link above to download the cuDNN binary for Windows x64. (You would need to register as a developer in order to download first).
    - Prevent any potential permissions issue by unblocking the downloaded binary zip
    - Copy `cuda/bin/cudnn67_7.dll` to where you put waifu2x-caffe.
    - Run `waifu2x-caffe.exe` and click on the `Check cuDNN` button to ensure that waifu2x can use the cuDNN library.


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

        // number of threads ffmpeg will run on, 0 defaults to having it use all of your cpu
        // recommended to run #cpu cores - 1 or 2 to avoid having cpu usage spike up to 100%
        "numThreads": 2,

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

        // full path of waifu2x-caffe executable
        "directory": "C:/dev/tools/waifu2x-caffe",

        // the model to use. This is a folder path from the base directory above
        "model": "models/anime_style_art",

        // you can run waifu2x-caffe-cui in CPU, GPU, or CUDNN mode, this contains common options for all modes
        "COMMON_PRESET": [
            ...
        ],

        // specific mode options
        "CPU_PRESET": [ ... ],
        "GPU_PRESET": [ ... ],
        "CUDNN_PRESET": [ ... ],

        // Work distribution. You can define as many threads as your PC can support. (ex. for 4 CPU cores + 1 gpu CUDA)
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
I encourage you to modify the settings to suit your own needs based on your image perferences and workload distribution. I've included some short sample videos under `test-vids`. You can look at other available [ffmpeg video encoders](https://www.ffmpeg.org/ffmpeg-codecs.html#Video-Encoders) and see available [waifu2x-caffe-cui options](https://github.com/kwsou/video2x/blob/master/docs/waifu2x-caffe-cui.md). For reference, I've included my configuration in `config/rtx-2080-ti.json`. Using the cuDNN library, only one cudnn thread is used as it is faster than the other modes.

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
