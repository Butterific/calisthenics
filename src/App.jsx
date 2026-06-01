import React, { useState, useEffect, useRef } from 'react';
import { Container, Typography, TextField, Button, Box, MenuItem, LinearProgress, Paper, Card, CardMedia, CardContent } from '@mui/material';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

import { getExercises } from './services/aiService';
import { getVideoForExercise } from './services/videoService';
import { generateWorkoutVideo } from './services/ffmpegService';

// Ensure you have these configured in a .env file locally for API requests:
// GEMINI=...
// PLEX=...

export default function App() {
  const [prompt, setPrompt] = useState('An intense core workout');
  const [numExercises, setNumExercises] = useState(3);
  const [duration, setDuration] = useState(10);
  const [quality, setQuality] = useState('720p');
  
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [progressRatio, setProgressRatio] = useState(-1);
  const [videoUrl, setVideoUrl] = useState(null);

  const ffmpegRef = useRef(new FFmpeg());
  const [ready, setReady] = useState(false);

  // Initialize FFmpeg
  useEffect(() => {
    const loadFFmpeg = async () => {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      const ffmpeg = ffmpegRef.current;
      
      ffmpeg.on('log', ({ message }) => {
        // Uncomment to see FFmpeg logs
        // console.log(message);
      });
      
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      setReady(true);
    };

    loadFFmpeg();
  }, []);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setVideoUrl(null);
    setProgressRatio(-1);
    setStatusMsg("Querying AI for exercise routine...");
    
    try {
        const exercises = await getExercises(prompt, numExercises, duration);

        setStatusMsg(`Got ${exercises.length} exercises. Locating stock footage...`);
        
        let videoLinks = [];
        for (let ex of exercises) {
            const link = await getVideoForExercise(ex.name);
            videoLinks.push(link);
        }

        setStatusMsg("Initializing local video generation engine...");
        const outputBlobUrl = await generateWorkoutVideo(
            ffmpegRef.current, 
            exercises, 
            videoLinks, 
            quality, 
            (msg) => setStatusMsg(msg),
            (ratio) => setProgressRatio(ratio)
        );

        setVideoUrl(outputBlobUrl);
        setProgressRatio(-1);
        setStatusMsg("Video rendering complete!");
        
    } catch (e) {
        console.error(e);
        setStatusMsg("Error occurred: " + e.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom color="primary.main" fontWeight={700}>
        Hackathon: AI Video Generator
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" paragraph>
        Turn any fitness prompt into a full, dynamic exercise video complete with looping footage, timers, title overlays, and changing background tracks. Processed 100% locally in your browser.
      </Typography>

      <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
        <Box display="flex" flexDirection="column" gap={3}>
          
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="bold">Configuration</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Live API Mode enabled. This requires GEMINI and PLEX keys in your .env file or host secrets.
          </Typography>

          <TextField 
            label="Workout Purpose / Prompt" 
            variant="outlined" 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            fullWidth 
            disabled={loading}
          />

          <Box display="flex" gap={2}>
            <TextField 
              label="Number of Exercises" 
              type="number" 
              value={numExercises}
              onChange={(e) => setNumExercises(Number(e.target.value))}
              disabled={loading}
              sx={{ flex: 1 }}
            />
            <TextField 
              label="Duration (seconds per exercise)" 
              type="number" 
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              disabled={loading}
              sx={{ flex: 1 }}
            />
            <TextField 
              label="Quality" 
              select 
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              disabled={loading}
              sx={{ flex: 1 }}
            >
              <MenuItem value="720p">720p (Faster)</MenuItem>
              <MenuItem value="1080p">1080p (Slower)</MenuItem>
            </TextField>
          </Box>

          <Button 
            variant="contained" 
            size="large" 
            onClick={handleGenerate} 
            disabled={loading || !ready}
            sx={{ py: 1.5, fontSize: '1.1rem', fontWeight: 'bold' }}
          >
            {loading ? "Processing..." : (ready ? "Generate Workout Video" : "Loading FFmpeg Engine...")}
          </Button>

          {loading && (
            <Box mt={2}>
              <Typography variant="body2" sx={{ mb: 1, fontFamily: 'monospace' }}>
                &gt; {statusMsg} {progressRatio >= 0 && `(${Math.round(progressRatio * 100)}%)`}
              </Typography>
              <LinearProgress 
                variant={progressRatio >= 0 ? "determinate" : "indeterminate"} 
                value={progressRatio >= 0 ? progressRatio * 100 : 0} 
              />
            </Box>
          )}

          {!loading && statusMsg && (
             <Typography variant="body2" color={statusMsg.includes("Error") ? "error.main" : "success.main"} fontWeight="bold">
               {statusMsg}
             </Typography>
          )}

        </Box>
      </Paper>

      {videoUrl && (
        <Card elevation={5} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <CardContent sx={{ pb: 0 }}>
                <Typography variant="h5" gutterBottom fontWeight="bold">Your Generated Workout</Typography>
            </CardContent>
            <CardMedia
                component="video"
                controls
                src={videoUrl}
                sx={{ maxHeight: 600, width: '100%', objectFit: 'contain', backgroundColor: 'black' }}
            />
            <CardContent sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
                 <Button variant="outlined" color="primary" href={videoUrl} download="workout.mp4">
                    Download Video
                 </Button>
            </CardContent>
        </Card>
      )}

    </Container>
  );
}