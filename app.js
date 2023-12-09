const express = require('express');
const fileUpload = require('express-fileupload');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

const app = express();
const port = process.env.PORT || 3000;

app.use(fileUpload());
app.use(express.static('public'));

// Bu kısmı ekledik
const shapeUrl = 'https://cdn.glitch.global/3d2dca12-b1f8-49b3-8d3e-eb99bc46f489/shape.png?v=1702071411813';
const shapePath = path.join(__dirname, 'public', 'shape.png');
https.get(shapeUrl, (response) => {
    response.pipe(fs.createWriteStream(shapePath));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.post('/upload', (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    const videoFile = req.files.video;
    const outputVideoPath = path.join(__dirname, 'public', 'outputvideo.mp4');

    videoFile.mv(path.join(__dirname, 'public', videoFile.name), (err) => {
        if (err) return res.status(500).send(err);

        const command = `ffmpeg -i public/${videoFile.name} -vf "movie=${shapePath} [mask]; [in][mask] overlay=0:0 [out]" -c:v libx264 -strict -2 ${outputVideoPath}`;

        const process = exec(command);

        process.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        process.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        process.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
            res.send({ success: true, outputVideoPath });
        });
    });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
