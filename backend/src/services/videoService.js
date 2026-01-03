const ffmpeg = require('fluent-ffmpeg');

// Set absolute paths for ffmpeg and ffprobe (WinGet installation)
const ffmpegPath = 'C:\\Users\\nsric\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.0.1-full_build\\bin\\ffmpeg.exe';
const ffprobePath = 'C:\\Users\\nsric\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.0.1-full_build\\bin\\ffprobe.exe';

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

exports.getVideoMetadata = (filePath) => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) return reject(err);
            const { duration, size } = metadata.format;
            const videoStream = metadata.streams.find(s => s.codec_type === 'video');
            resolve({
                duration,
                size,
                resolution: videoStream ? `${videoStream.width}x${videoStream.height}` : 'unknown',
                codec: videoStream ? videoStream.codec_name : 'unknown',
                bitrate: videoStream ? videoStream.bit_rate : 0
            });
        });
    });
};

const extractFrame = (videoPath, outputPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .screenshots({
                timestamps: ['50%'],
                filename: path.basename(outputPath),
                folder: path.dirname(outputPath),
                size: '640x?'
            })
            .on('end', () => resolve(outputPath))
            .on('error', (err) => reject(err));
    });
};

const extractAudio = (videoPath, outputPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .toFormat('mp3')
            .on('end', () => resolve(outputPath))
            .on('error', (err) => reject(err))
            .save(outputPath);
    });
};

exports.processVideo = async (filePath, outputDir, onProgress) => {
    const audioPath = path.join('uploads', `audio-${Date.now()}.mp3`);
    const framePath = path.join('uploads', `frame-${Date.now()}.jpg`);

    try {
        // 1. Progress Simulation (UI feedback)
        onProgress(10);

        // 2. Extract Frame & Audio
        try {
            await Promise.all([
                extractFrame(filePath, framePath),
                extractAudio(filePath, audioPath)
            ]);
        } catch (e) {
            console.error('Extraction failed:', e);
        }
        onProgress(30);

        // 3. Audio Transcription (Whisper Large V3 Turbo)
        let transcript = "";
        try {
            if (fs.existsSync(audioPath)) {
                const transcription = await groq.audio.transcriptions.create({
                    file: fs.createReadStream(audioPath),
                    model: "whisper-large-v3-turbo",
                });
                transcript = transcription.text;
                console.log(`Transcription for ${path.basename(filePath)}:`, transcript);
            }
        } catch (e) {
            console.error('Transcription failed:', e);
        }
        onProgress(50);

        // 4. Vision Analysis (Llama 4 Scout)
        let visionSensitivity = 'Safe';
        try {
            if (fs.existsSync(framePath)) {
                const base64Image = fs.readFileSync(framePath, { encoding: 'base64' });
                const visionCompletion = await groq.chat.completions.create({
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": "Analyze this video frame for potentially sensitive content (violence, adult content, hate speech, or illegal activities). Reply with ONLY one word: 'Safe' or 'Flagged'."
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": `data:image/jpeg;base64,${base64Image}`
                                    }
                                }
                            ]
                        }
                    ],
                    "model": "meta-llama/llama-4-scout-17b-16e-instruct",
                    "temperature": 0,
                    "max_tokens": 10
                });
                const result = visionCompletion.choices[0].message.content.trim();
                console.log(`Vision Analysis Result for ${path.basename(filePath)}:`, result);
                visionSensitivity = result.toLowerCase().includes('flagged') ? 'Flagged' : 'Safe';
            }
        } catch (e) {
            console.error('Vision analysis failed:', e);
        }
        onProgress(70);

        // 5. Final Content Analysis (Llama 3.3 70B Versatile)
        let finalSensitivity = visionSensitivity;
        try {
            const contentCompletion = await groq.chat.completions.create({
                "messages": [
                    {
                        "role": "user",
                        "content": `Analyze the following video metadata and transcript for sensitive content (violence, adult content, hate speech).
                        Filename: ${path.basename(filePath)}
                        Transcript: ${transcript || "No audio content detected."}
                        Visual Analysis Result: ${visionSensitivity}
                        
                        If the visual analysis is 'Flagged', or if the transcript or filename contains sensitive content, reply 'Flagged'. Otherwise, reply 'Safe'.
                        Reply with ONLY one word: 'Safe' or 'Flagged'.`
                    }
                ],
                "model": "llama-3.3-70b-versatile",
                "temperature": 0,
                "max_tokens": 10
            });
            const result = contentCompletion.choices[0].message.content.trim();
            console.log(`Final Content Analysis Result for ${path.basename(filePath)}:`, result);
            finalSensitivity = result.toLowerCase().includes('flagged') ? 'Flagged' : 'Safe';
        } catch (e) {
            console.error('Content analysis failed:', e);
        }

        // Cleanup temporary files
        if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
        // Note: framePath is kept as thumbnailPath

        onProgress(100);
        return {
            sensitivityStatus: finalSensitivity,
            status: 'Completed',
            thumbnailPath: framePath
        };
    } catch (error) {
        console.error('Multi-Modal Analysis Error:', error);
        if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
        onProgress(100);
        return { sensitivityStatus: 'Safe', status: 'Completed', thumbnailPath: framePath };
    }
};
