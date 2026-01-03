const Video = require('../models/Video');
const videoService = require('../services/videoService');

exports.uploadVideo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send({ error: 'No video file uploaded' });
        }

        const metadata = await videoService.getVideoMetadata(req.file.path);

        const video = new Video({
            title: req.body.title || req.file.originalname,
            description: req.body.description,
            filename: req.file.filename,
            originalName: req.file.originalname,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype,
            duration: metadata.duration,
            uploadedBy: req.user._id,
            tenantId: req.user.tenantId, // Will be null for global Admin
            metadata: {
                resolution: metadata.resolution,
                bitrate: metadata.bitrate,
                codec: metadata.codec
            }
        });

        await video.save();

        const { io } = require('../index');

        // Start async processing
        videoService.processVideo(video.path, 'uploads/processed', (progress) => {
            video.processingProgress = progress;
            if (progress === 100) video.status = 'Completed';
            if (progress < 100) video.save();

            // Emit progress to tenant room (or global room for Admin)
            const room = video.tenantId ? video.tenantId.toString() : 'global_admin';
            io.to(room).emit('videoProgress', {
                videoId: video._id,
                progress,
                status: video.status
            });
        }).then(result => {
            video.sensitivityStatus = result.sensitivityStatus;
            video.status = result.status;
            video.thumbnailPath = result.thumbnailPath;
            video.save();

            const room = video.tenantId ? video.tenantId.toString() : 'global_admin';
            io.to(room).emit('videoComplete', {
                videoId: video._id,
                sensitivityStatus: video.sensitivityStatus,
                status: video.status
            });
        });

        res.status(201).send(video);
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
};

exports.getVideos = async (req, res) => {
    try {
        let query = { tenantId: req.user.tenantId };

        // Global Admin sees everything
        if (req.user.role === 'Admin') {
            query = {};
        }

        const videos = await Video.find(query).populate('tenantId', 'name');
        res.send(videos);
    } catch (e) {
        res.status(500).send();
    }
};

exports.streamVideo = async (req, res) => {
    try {
        let query = { _id: req.params.id, tenantId: req.user.tenantId };

        // Global Admin can stream anything
        if (req.user.role === 'Admin') {
            query = { _id: req.params.id };
        }

        const video = await Video.findOne(query);
        if (!video) return res.status(404).send();

        const range = req.headers.range;
        if (!range) {
            return res.status(400).send('Requires Range header');
        }

        const videoPath = video.path;
        const videoSize = video.size;
        const CHUNK_SIZE = 10 ** 6; // 1MB
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + CHUNK_SIZE, videoSize - 1);

        const contentLength = end - start + 1;
        const headers = {
            "Content-Range": `bytes ${start}-${end}/${videoSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": contentLength,
            "Content-Type": video.mimetype,
        };

        res.writeHead(206, headers);
        const videoStream = require('fs').createReadStream(videoPath, { start, end });
        videoStream.pipe(res);
    } catch (e) {
        res.status(500).send();
    }
};

exports.deleteVideo = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).send();

        // Check permissions
        if (req.user.role !== 'Admin' && video.tenantId.toString() !== req.user.tenantId.toString()) {
            return res.status(403).send({ error: 'Unauthorized access to this video' });
        }

        await Video.findByIdAndDelete(req.params.id);

        // Cleanup file
        const fs = require('fs');
        if (fs.existsSync(video.path)) {
            fs.unlinkSync(video.path);
        }

        res.send(video);
    } catch (e) {
        res.status(500).send();
    }
};
