import Busboy from 'busboy';

export const config = {
  api: {
    bodyParser: false
  }
};

function readMultipart(req) {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.startsWith('multipart/form-data')) {
      reject(new Error('Expected multipart/form-data.'));
      return;
    }

    const busboy = Busboy({ headers: req.headers, limits: { files: 1, fileSize: 8 * 1024 * 1024, fields: 5 } });
    let fileBuffer = null;
    let fileName = 'bca-question.webm';
    let mimeType = 'audio/webm';
    let model = null;
    let fileTooLarge = false;

    busboy.on('field', (name, value) => {
      if (name === 'model') model = value;
    });

    busboy.on('file', (name, file, info) => {
      if (name !== 'file') {
        file.resume();
        return;
      }

      fileName = info.filename || fileName;
      mimeType = info.mimeType || mimeType;

      const chunks = [];
      file.on('data', chunk => chunks.push(chunk));
      file.on('limit', () => { fileTooLarge = true; file.resume(); });
      file.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    busboy.on('finish', () => {
      if (!fileBuffer) {
        reject(new Error('Audio file is required.'));
        return;
      }
      if (fileTooLarge) {
        reject(new Error('Audio file is too large. Maximum size is 8 MB.'));
        return;
      }
      resolve({ fileBuffer, fileName, mimeType, model });
    });

    busboy.on('error', reject);
    req.pipe(busboy);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('GROQ_API_KEY is not configured');
    return res.status(500).json({ error: 'AI service is not configured.' });
  }

  try {
    const {
      fileBuffer,
      fileName,
      mimeType
    } = await readMultipart(req);

    const allowedAudio = ['audio/webm', 'audio/ogg', 'audio/wav', 'audio/mpeg', 'audio/mp4', 'video/webm'];
    if (!allowedAudio.includes(mimeType)) {
      return res.status(415).json({ error: 'Unsupported audio format.' });
    }

    const model = process.env.GROQ_STT_MODEL || 'whisper-large-v3-turbo';

    const groqForm = new FormData();
    groqForm.append(
      'file',
      new Blob([fileBuffer], { type: mimeType }),
      fileName
    );
    groqForm.append('model', model);
    groqForm.append('response_format', 'json');
    groqForm.append('temperature', '0');

    const response = await fetch(
      'https://api.groq.com/openai/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: groqForm
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Groq transcription error:', response.status, data);
      return res.status(response.status).json({
        error: data?.error?.message || 'Speech-to-text request failed.'
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Transcription API error:', error);
    return res.status(400).json({
      error: error?.message || 'Unable to transcribe the audio.'
    });
  }
}
