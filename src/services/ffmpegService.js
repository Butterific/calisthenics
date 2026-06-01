import { fetchFile } from '@ffmpeg/util';

const FONT_URL = "https://raw.githubusercontent.com/ffmpegwasm/testdata/master/arial.ttf";

export const generateWorkoutVideo = async (ffmpeg, exercises, videoLinks, quality, onProgress, onRatio) => {
    // Ensure FFmpeg is loaded
    if (!ffmpeg.loaded) {
        throw new Error("FFmpeg is not loaded.");
    }
    
    onProgress("Downloading fonts and starting encoding engine...");
    
    // Load font
    await ffmpeg.writeFile('arial.ttf', await fetchFile(FONT_URL));

    let filterGraph = "";
    let inputs = [];
    const totalDuration = exercises.reduce((acc, ex) => acc + ex.duration, 0);

    onProgress("Downloading clip assets...");
    for(let i=0; i<exercises.length; i++) {
        const url = videoLinks[i];
        const localName = `input_${i}.mp4`;
        await ffmpeg.writeFile(localName, await fetchFile(url));
        inputs.push(localName);
        
        // Build video filter part: 
        // 1. Loop over the clip to hit the exercise duration (in case clip is too short)
        // 2. Set scale (quality mapping) e.g., 1920:1080 or 1280:720
        // 3. Draw text (Title at the top, countdown timer at the bottom right)
        
        let scale;
        if (quality === '1080p') scale = '1920:1080';
        else if (quality === '720p') scale = '1280:720';
        else if (quality === '480p') scale = '854:480';
        else scale = '640:360';
        
        // Force framerate down to 15 EARLY so text rendering and scaling happens on fewer frames
        filterGraph += `[${i}:v]loop=loop=-1:size=32767,trim=duration=${exercises[i].duration},fps=15,scale=${scale}:force_original_aspect_ratio=increase,crop=${scale},setsar=1,`;
        // Text overlay: Exercise Name
        filterGraph += `drawtext=fontfile=arial.ttf:text='${exercises[i].name}':fontcolor=white:fontsize=72:box=1:boxcolor=black@0.5:boxborderw=10:x=(w-text_w)/2:y=100,`;
        // Timer overlay: Countdown
        // time runs from 0 to duration. Let's do (duration - t) to get countdown
        filterGraph += `drawtext=fontfile=arial.ttf:text='%{eif\\:${exercises[i].duration}-t\\:d} s':fontcolor=white:fontsize=96:box=1:boxcolor=red@0.8:boxborderw=15:x=w-text_w-50:y=h-text_h-50[v${i}];`;
    }

    // Concat all video branches
    let concatStr = "";
    for(let i=0; i<exercises.length; i++){
        concatStr += `[v${i}]`;
    }
    filterGraph += `${concatStr}concat=n=${exercises.length}:v=1:a=0[outv];`;

    onProgress("Fetching audio loop...");
    // Let's use a sample audio since getting random files from a raw directory via fetch isn't straightforward without a manifest.
    // Hackathon trick: statically fetch a random music file since we know there are 5.
    const randomTrackId = Math.floor(Math.random() * 5) + 1;
    const trackFile = `fitness-${randomTrackId}.m4a`;
    const audioLocalStr = `audio.m4a`;
    try {
        await ffmpeg.writeFile(audioLocalStr, await fetchFile(`/assets/music/${trackFile}`));
    } catch(e) {
        console.warn(`Failed to load local ${trackFile}, using a remote fallback`);
        await ffmpeg.writeFile(audioLocalStr, await fetchFile('https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Tours/Enthusiast/Tours_-_01_-_Enthusiast.mp3'));
    }

    // Audio filter: loop indefinitely, trim to totalDuration
    const audioIndex = exercises.length;
    filterGraph += `[${audioIndex}:a]aloop=loop=-1:size=2e+09,atrim=duration=${totalDuration}[outa]`;

    // Construct args
    let args = [];
    // Inputs (videos)
    for(let i=0; i<exercises.length; i++){
        args.push("-i", inputs[i]);
    }
    // Input (audio)
    args.push("-i", audioLocalStr);

    args.push(
        "-filter_complex", filterGraph,
        "-map", "[outv]",
        "-map", "[outa]",
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-threads", "4",
        "-r", "15",
        "-crf", "35
        "-crf", "30",
        "-c:a", "aac",
        "-y",
        "output.mp4"
    );

    onProgress("Running FFmpeg Engine (this will take a while)...");
    
    // Listen to FFmpeg logs if needed
    ffmpeg.on('log', ({ message }) => {
        console.log(message);
    });

    const progressHandler = ({ progress, time }) => {
        if (onRatio) onRatio(progress);
    };
    ffmpeg.on('progress', progressHandler);

    await ffmpeg.exec(args);

    ffmpeg.off('progress', progressHandler);

    onProgress("Finishing and formatting export...");
    const data = await ffmpeg.readFile('output.mp4');
    
    const blob = new Blob([data.buffer], { type: 'video/mp4' });
    const finalUrl = URL.createObjectURL(blob);
    return finalUrl;
};
