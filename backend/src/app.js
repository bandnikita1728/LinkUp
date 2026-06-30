import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";
import cors from "cors";
import userRoutes from "./routes/users.routes.js";
import dotenv from "dotenv";
import axios from "axios";
import FormData from "form-data";
import multer from "multer";

dotenv.config();

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", process.env.PORT || 9000);

app.use(cors({
    origin: '*',
    credentials: false
}));

app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/translate-audio', upload.single('file'), async (req, res) => {
    try {
        const language = req.body.language || 'hi-IN'
        const targetLang = req.body.targetLang || 'en'
        const isEnglish = language === 'en-US' || language === 'en-IN' || language === 'en'

        console.log('[SARVAM] language:', language, 'targetLang:', targetLang, 'isEnglish:', isEnglish)

        const form = new FormData()
        form.append('file', req.file.buffer, {
            filename: 'audio.webm',
            contentType: req.file.mimetype
        })
        form.append('model', 'saaras:v3')

        if (isEnglish) {
            form.append('mode', 'transcribe')
        } else {
            form.append('mode', 'translate')
            form.append('language_code', language)
        }

        const response = await axios.post(
            'https://api.sarvam.ai/speech-to-text',
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    'api-subscription-key': process.env.SARVAM_API_KEY
                }
            }
        )

        let transcript = response.data.transcript
        console.log('[SARVAM] Transcript:', transcript)

        if (isEnglish && targetLang !== 'en') {
            console.log('[SARVAM] Translating en →', targetLang)
            try {
                const translateRes = await axios.get(
                    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(transcript)}&langpair=en|${targetLang}`
                )
                const translated = translateRes.data?.responseData?.translatedText
                if (translated && translateRes.data?.responseStatus === 200) {
                    transcript = translated
                    console.log('[SARVAM] Translated:', transcript)
                }
            } catch(e) {
                console.log('[SARVAM] Text translation failed:', e.message)
            }
        }

        res.json({ translated: transcript })

    } catch (err) {
        console.error('[SARVAM] Error:', err.response?.data || err.message)
        res.status(500).json({ error: err.message, translated: '' })
    }
})

app.use("/api/v1/users", userRoutes);

app.get("/", (req, res) => {
    res.json({ message: "LinkUp API is running" });
});

const start = async () => {
    try {
        const connectionDb = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB connected: ${connectionDb.connection.host}`);
        server.listen(app.get("port"), () => {
            console.log(`Server running on port ${app.get("port")}`);
        });
    } catch (err) {
        console.error("Failed to connect to MongoDB:", err.message);
        process.exit(1);
    }
};

start();