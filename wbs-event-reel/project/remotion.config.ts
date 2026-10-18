import {Config} from '@remotion/cli/config';

// Rendering settings for the final delivery (H.264 / yuv420p / AAC, SDR bt709).
Config.setVideoImageFormat('png');
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
Config.setCrf(14);
Config.setColorSpace('bt709');
Config.setAudioCodec('aac');
Config.setAudioBitrate('320k');
Config.setConcurrency(4);
// Uses the system Chromium headless shell when REMOTION_BROWSER is set; otherwise Remotion downloads its own.
if (process.env.REMOTION_BROWSER) {
	Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
}
