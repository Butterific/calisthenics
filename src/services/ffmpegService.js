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

    let scale;
    if (quality === '1080p') scale = '1920:1080';
    else if (quality === '720p') scale = '1280:720';
    else if (quality === '480p') scale = '854:480';
    else scale = '640:360';

    const totalDuration = exercises.reduce((acc, ex) => acc + ex.duration, 0);
    let tsFiles = [];

    // Listen to FFmpeg logs if needed
    ffmpeg.on('log', ({ message }) => {
        // console.log(message);
    });

    for(let i=0; i<exercises.length; i++) {
        onProgress(`Processing exercise ${i+1}/${exercises.length}: ${exercises[i].name}...`);
        const url = videoLinks[i];
        const localName = `input_${i}.mp4`;
        await ffmpeg.writeFile(localName, await fetchFile(url));
        
        let filterGraph = `scale=${scale}:force_original_aspect_ratio=increase,crop=${scale},setsar=1,`;
        // Text overlay: Exercise Name (Bottom Center, smaller text to prevent cutoff)
        filterGraph += `drawtext=fontfile=arial.ttf:text='${exercises[i].name}':fontcolor=white:fontsize=40:box=1:boxcolor=black@0.5:boxborderw=10:x=(w-text_w)/2:y=h-80,`;
        // Timer overlay: Countdown (Top Right, smaller)
        filterGraph += `drawtext=fontfile=arial.ttf:text='%{eif\\:${exercises[i].duration}-t\\:d} s':fontcolor=white:fontsize=32:box=1:boxcolor=red@0.8:boxborderw=8:x=w-text_w-20:y=20`;

        const outName = `part_${i}.ts`;
        tsFiles.push(outName);

        const progressHandler = ({ progress }) => {
            if (onRatio) {
                // Calculate overall ratio for the entire batch
                const globalProgress = (i + Math.min(progress, 1)) / exercises.length;
                onRatio(globalProgress);
            }
        };
        ffmpeg.on('progress', progressHandler);

        // Run individual process to .ts to avoid memory exhaustion
        await ffmpeg.exec([
            "-stream_loop", "-1", // loop indefinitely
            "-i", localName,
            "-t", `${exercises[i].duration}`,
            "-vf", filterGraph,
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-tune", "fastdecode,zerolatency",
            "-r", "15",
            "-crf", "35",
            "-an", // No audio yet
            "-y",
            outName
        ]);
        
        ffmpeg.off('progress', progressHandler);

        // Clean up input to save WASM heap memory
        await ffmpeg.deleteFile(localName);
    }

    onProgress("Fetching audio track...");
    const randomTrackId = Math.floor(Math.random() * 5) + 1;
    const trackFile = `fitness-${randomTrackId}.m4a`;
    const audioLocalStr = `audio.m4a`;
    try {
        await ffmpeg.writeFile(audioLocalStr, await fetchFile(`/assets/music/${trackFile}`));
    } catch(e) {
        console.warn(`Failed to load local ${trackFile}, using a remote fallback`);
        await ffmpeg.writeFile(audioLocalStr, await fetchFile('https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Tours/Enthusiast/Tours_-_01_-_Enthusiast.mp3'));
    }

    onProgress("Merging audio and rendering final file (Instant)...");
    
    // Combine intermediate files with zero re-encoding using concat demuxer
    const concatList = tsFiles.join('|');
    
    if (onRatio) onRatio(0.99);

    await ffmpeg.exec([
        "-i", `concat:${concatList}`,
        "-stream_loop", "-1",
        "-i", audioLocalStr,
        "-t", `${totalDuration}`,
        "-c:v", "copy",   // COPY video - insanely fast
        "-c:a", "aac",
        "-map", "0:v:0",
        "-map", "1:a:0",
        "-y",
        "output.mp4"
    ]);

    onProgress("Finishing and formatting export...");
    const data = await ffmpeg.readFile('output.mp4');
    
    // Clean up to prevent memleaks
    for(let f of tsFiles) await ffmpeg.deleteFile(f);
    await ffmpeg.deleteFile(audioLocalStr);
    
    const blob = new Blob([data.buffer], { type: 'video/mp4' });
    const finalUrl = URL.createObjectURL(blob);
    return finalUrl;
};
