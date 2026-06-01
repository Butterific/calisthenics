// Pexels API Wrapper for fetching fitness videos

export const getVideoForExercise = async (exerciseName) => {
    const apiKey = import.meta.env.PLEX;
    if(!apiKey) {
        throw new Error("Missing PLEX API key. Setup your .env file or Cloudflare secrets.");
    }
    
    // query Pexels
    const url = `https://api.pexels.com/videos/search?query=fitness ${encodeURIComponent(exerciseName)}&per_page=1`;
    const res = await fetch(url, {
        headers: {
            'Authorization': apiKey
        }
    });

    if(!res.ok){
       const errorData = await res.json().catch(()=>({}));
       throw new Error(`Pexels Request failed with status ${res.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await res.json();
    if(data.videos && data.videos.length > 0) {
        const videoFiles = data.videos[0].video_files;
        // Sort smallest to largest, try to pick SD/720p to prevent WebAssembly memory crashes
        const preferred = videoFiles.sort((a,b) => a.height - b.height).find(v => v.height >= 360 && v.height <= 720) || videoFiles.sort((a,b) => a.height - b.height)[0];
        return preferred.link;
    }
    
    // fallback if no videos found
    return "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
}
