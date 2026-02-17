import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put } from '@vercel/blob';
import multiparty from 'multiparty';
import fs from 'fs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-api-key'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const form = new multiparty.Form();

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('Error parsing form:', err);
            return res.status(500).json({ error: 'Error parsing form data' });
        }

        const file = files.file?.[0];
        if (!file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        try {
            const fileContent = fs.readFileSync(file.path);
            const blob = await put(file.originalFilename, fileContent, {
                access: 'public',
                contentType: file.headers['content-type'],
            });

            return res.status(200).json(blob);
        } catch (error) {
            console.error('Error uploading to Vercel Blob:', error);
            return res.status(500).json({ error: 'Failed to upload file' });
        }
    });
}
