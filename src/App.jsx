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
  const [numExercises, setNumExercises] = useState(2);
  const [duration, setDuration] = useState(5);
  const [quality, setQuality] = useState('360p');
  
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
        wasmURL: await toBlobURL(`${baseURL}/wasmURL/ffmpeg-core.wasm`, 'application/wasm'),
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
        let usedLinks = new Set();
        for (let ex of exercises) {
            const link = await getVideoForExercise(ex.name, usedLinks);
            videoLinks.push(link);
            if (link) usedLinks.add(link);
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
        loading && setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box display="flex" alignItems="center" gap={3} mb={4}>
        <img src="/logo.svg" alt="Calisthenics Logo" width="56" height="56" style={{ color: '#6750A4' }} />
        <Typography variant="h3" component="h1" color="primary.main" fontWeight={700} sx={{ margin: 0 }}>
          Calisthenics
        </Typography>
      </Box>
      
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 6 }} paragraph>
        Turn any fitness prompt into a full, dynamic exercise video to help your{' '}
        <span className="rainbow-word">trAIning</span>.
      </Typography>

      <Paper elevation={3} sx={{ p: { xs: 3, sm: 5 }, mb: 6, borderRadius: 3 }}>
        <Box display="flex" flexDirection="column" gap={4.5}>
          
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="bold">Configuration</Typography>
          </Box>

          <TextField 
            label="Workout Purpose / Prompt" 
            variant="outlined" 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            fullWidth 
            disabled={loading}
          />

          <Box
            display="grid"
            gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr 1.25fr' }}
            columnGap={4}
            rowGap={3}
          >
            <TextField 
              label="Number of Exercises" 
              type="number" 
              value={numExercises}
              onChange={(e) => setNumExercises(Number(e.target.value))}
              disabled={loading}
              sx={{ minWidth: 0 }}
            />
            <TextField 
              label="Duration (seconds per exercise)" 
              type="number" 
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              disabled={loading}
              sx={{ minWidth: 0 }}
            />
            <TextField 
              label="Quality" 
              select 
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              disabled={loading}
              sx={{ minWidth: 0 }}
            >
              <MenuItem value="360p">360p (Lightning Fast - Demo)</MenuItem>
              <MenuItem value="480p">480p (Fast)</MenuItem>
              <MenuItem value="720p">720p (Normal)</MenuItem>
              <MenuItem value="1080p">1080p (Slow)</MenuItem>
            </TextField>
          </Box>

          <Button 
            variant="contained" 
            size="large" 
            onClick={handleGenerate} 
            disabled={loading || !ready}
            sx={{ py: 1.75, mt: 1, fontSize: '1.1rem', borderRadius: '9999px' }}
          >
            {loading ? "Processing..." : (ready ? "Generate Workout Video" : "Loading FFmpeg Engine...")}
          </Button>

          {(loading || statusMsg) && (
            <Box mt={1} pt={1}>
              {loading && (
                <>
                  <Typography variant="body2" sx={{ mb: 1.5, fontFamily: 'monospace' }}>
                    &gt; {statusMsg} {progressRatio >= 0 && `(${Math.round(progressRatio * 100)}%)`}
                  </Typography>
                  <LinearProgress 
                    variant={progressRatio >= 0 ? "determinate" : "indeterminate"} 
                    value={progressRatio >= 0 ? progressRatio * 100 : 0} 
                  />
                </>
              )}

              {!loading && statusMsg && (
                 <Typography variant="body2" color={statusMsg.includes("Error") ? "error.main" : "success.main"} fontWeight="bold">
                   {statusMsg}
                 </Typography>
              )}
            </Box>
          )}

        </Box>
      </Paper>

      {videoUrl && (
        <Card elevation={5} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <CardContent sx={{ pb: 2 }}>
                <Typography variant="h5" fontWeight="bold">Your Generated Workout</Typography>
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
