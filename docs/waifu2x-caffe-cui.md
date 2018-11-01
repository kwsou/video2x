# Waifu2x-Caffe-CUI Options

Haven't really found a resource explaining the various options you can pass into waifu2x-caffe (in english) so I am leaving this list here for reference. You can look at the help command if you run `waifu2x-caffe-cui.exe --help`.

This output is based on [waifu2x-caffe](https://github.com/lltcggie/waifu2x-caffe) v1.1.9.2:

```
USAGE:

   waifu2x-caffe-cui.exe  [-t <0|1>] [--gpu <int>] [-b <int>] [--crop_h
                          <int>] [--crop_w <int>] [-c <int>] [-d <int>] [-q
                          <int>] [-p <cpu|gpu|cudnn>] [--model_dir
                          <string>] [-h <double>] [-w <double>] [-s
                          <double>] [-n <0|1|2|3>] [-m <noise|scale
                          |noise_scale|auto_scale>] [-e <string>] [-l
                          <string>] [-o <string>] -i <string> [--]
                          [--version] [-?]


Where:

   -t <0|1>,  --tta <0|1>
     8x slower and slightly high quality

   --gpu <int>
     gpu device no

   -b <int>,  --batch_size <int>
     input batch size

   --crop_h <int>
     input image split size(height)

   --crop_w <int>
     input image split size(width)

   -c <int>,  --crop_size <int>
     input image split size

   -d <int>,  --output_depth <int>
     output image chaneel depth bit

   -q <int>,  --output_quality <int>
     output image quality

   -p <cpu|gpu|cudnn>,  --process <cpu|gpu|cudnn>
     process mode

   --model_dir <string>
     path to custom model directory (don't append last / )

   -h <double>,  --scale_height <double>
     custom scale height

   -w <double>,  --scale_width <double>
     custom scale width

   -s <double>,  --scale_ratio <double>
     custom scale ratio

   -n <0|1|2|3>,  --noise_level <0|1|2|3>
     noise reduction level

   -m <noise|scale|noise_scale|auto_scale>,  --mode <noise|scale
      |noise_scale|auto_scale>
     image processing mode

   -e <string>,  --output_extention <string>
     extention to output image file when output_path is (auto) or
     input_path is folder

   -l <string>,  --input_extention_list <string>
     extention to input image file when input_path is folder

   -o <string>,  --output_path <string>
     path to output image file (when input_path is folder, output_path must
     be folder)

   -i <string>,  --input_path <string>
     (required)  path to input image file

   --,  --ignore_rest
     Ignores the rest of the labeled arguments following this flag.

   --version
     Displays version information and exits.

   -?,  --help
     Displays usage information and exits.


   waifu2x reimplementation using Caffe
   ```
