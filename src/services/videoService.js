// Pexels API Wrapper for fetching fitness videos

export const mockGetVideo = (exerciseName) => {
    // Return a sample small video URL to prevent blowing up the network
    console.log(`MOCK Pexels: fetched generic mock clip for ${exerciseName}`);
    // Example test video (Big Buck Bunny snippet)
    return Promise.resolve("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4");
}

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
        // Try to pick HD (1080p) or highest available
        const preferred = videoFiles.find(v => v.height >= 1080) || videoFiles[0];
        return preferred.link;
    }
    
    // fallback if no videos found
    return "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
}
