import { GoogleGenAI } from "@google/genai";

import 'dotenv/config';
import express from "express";
import multer from "multer";
import fs from "fs/promises";
import cors from "cors";
import { text } from "stream/consumers";

const app = express();
const upload = multer();
const ai = new GoogleGenAI({});

const geminiModels = {
  text: 'gemini-2.5-flash-lite',
  chat: 'gemini-2.5-pro',
  image: 'gemini-2.5-flash',
  audio: 'gemini-2.5-flash-lite',
  document: 'gemini-2.5-flash-lite'
};

app.use(cors()); 
app.use(express.json());
app.use(express.static('public')); // ketika diakses di localhost akan langsung mengarah ke folder public

app.post('/generate-text', async (req, res) => {

  const { message } = req.body || {};

  if (!message || typeof message != 'string') {
    res.status(400).send('Pesan tidak ada atau format-nya tidak sesuai.');
    return; // keluar lebih awal dari handler
  }

  const response = await ai.models.generateContent({
    contents: message,
    model: geminiModels.text
  });

  res.status(200).send({
    reply: response.text
  });
  
});

app.post('/chat', async (req, res) => {
  const { conversation } = req.body;

  // Guard clause 1 -- cek conversation-nya itu array atau bukan
  if (!conversation || !Array.isArray(conversation)) {
    res.status(400).json( { 
      success: false,
      data: null,
      message: 'Percakapan tidak valid!' 
    });
  }

  // Guard clause 2 -- cek integritas data
  let dataIsInvalid = false; // sementic

  [].forEach(item => {
    if (!item) {
      dataIsInvalid = true;
    } else if (typeof item !== 'object') {
      dataIsInvalid = true;
    } else if (!item.role || !item.message) {
      dataIsInvalid = true;
    }
  });

  if (dataIsInvalid) {
   return res.status(400).json( { 
      success: false,
      data: null,
      message: 'Ada data invalid pada percakapan yang dikirim.'
    });
  }

  // Mapping
  const contents = conversation.map(item => {
    return { 
      role: item.role,
      parts: [
        { text : item.message }
      ]
    }
  });

  try {
    const aiResponse = await ai.models.generateContent({
      contents, //object property shorthand
      model: geminiModels.chat
    });

    return res.status(200).json({
      success: true,
      data: aiResponse.text,
      message: null
    });
  } catch(err) {
    console.log({err});
    return res.status(err.code ?? 500).json({
      success: false,
      data: null,
      message: err.message
    });
  }
});

const port = 3000;

app.listen(port, () => {
  console.log("I LOVE YOU", port);
});
