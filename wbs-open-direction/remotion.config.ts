import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('png');
Config.setPixelFormat('yuv420p');
Config.setCodec('h264');
Config.setCrf(10);
Config.setX264Preset("slow");
Config.setAudioBitrate('320k');
Config.setConcurrency(4);
Config.setOverwriteOutput(true);
// Pre-installed headless Chromium (no download needed). Remove this line to let Remotion fetch its own.
Config.setBrowserExecutable(process.env.REMOTION_BROWSER ?? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell');
