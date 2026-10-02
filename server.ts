import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Body parsing with generous limit for high-res images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const publicDir = path.resolve(__dirname, 'public');
const cornerDesignsDir = path.resolve(publicDir, 'backgrounds/corner-designs');
const uploadsDir = path.resolve(publicDir, 'backgrounds/uploads');
const communityFile = path.resolve(publicDir, 'backgrounds/community_backgrounds.json');

// Ensure directories exist
fs.mkdirSync(cornerDesignsDir, { recursive: true });
fs.mkdirSync(uploadsDir, { recursive: true });

// Initial community designs file if not present
if (!fs.existsSync(communityFile)) {
  const initialCommunity = [
    {
      id: 'corner-floral-pink',
      title: 'Floral Butterflies & Bees - Pink',
      category: 'Corner Designs',
      style: 'natural',
      url: '/backgrounds/corner-designs/floral-butterflies-bees-pink.png',
      tags: ['floral', 'flowers', 'pink', 'butterflies', 'bees', 'corner', 'frame'],
      createdAt: Date.now() - 100000
    },
    {
      id: 'corner-vintage-garden',
      title: 'Vintage Garden Frame - Corner',
      category: 'Corner Designs',
      style: 'natural',
      url: '/backgrounds/corner-designs/vintage-garden-frame-corner.png',
      tags: ['vintage', 'garden', 'frame', 'botanical', 'corner', 'parchment'],
      createdAt: Date.now() - 50000
    }
  ];
  fs.writeFileSync(communityFile, JSON.stringify(initialCommunity, null, 2));
}

// Serve public static files directly
app.use(express.static(publicDir));

// API 1: Get all shared Community Corner Designs
app.get('/api/community-backgrounds', (_req, res) => {
  try {
    if (fs.existsSync(communityFile)) {
      const raw = fs.readFileSync(communityFile, 'utf-8');
      const items = JSON.parse(raw);
      return res.json({ success: true, items });
    }
    return res.json({ success: true, items: [] });
  } catch (err) {
    console.error('Error reading community backgrounds:', err);
    return res.status(500).json({ success: false, error: 'Failed to read backgrounds' });
  }
});

// API 2: Upload Background to permanent storage (/public/backgrounds/corner-designs/)
app.post('/api/upload-background', (req, res) => {
  try {
    const { title, dataUrl, filename } = req.body;
    if (!dataUrl) {
      return res.status(400).json({ success: false, error: 'No dataUrl provided' });
    }

    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, error: 'Invalid base64 dataUrl' });
    }

    const mime = matches[1];
    const base64Data = matches[2];
    const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';

    const safeTitle = (title || 'corner-design')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 30);
    const uniqueId = `corner-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const savedFilename = filename || `${safeTitle}-${uniqueId}.${ext}`;
    const filePath = path.join(cornerDesignsDir, savedFilename);

    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

    const publicUrl = `/backgrounds/corner-designs/${savedFilename}`;
    const newItem = {
      id: uniqueId,
      title: title || 'Custom Corner Design',
      category: 'Corner Designs',
      style: 'natural',
      url: publicUrl,
      tags: ['community', 'corner', 'upload', 'custom'],
      createdAt: Date.now()
    };

    // Update community backgrounds JSON
    let currentItems: any[] = [];
    if (fs.existsSync(communityFile)) {
      try {
        currentItems = JSON.parse(fs.readFileSync(communityFile, 'utf-8'));
      } catch {}
    }
    currentItems.unshift(newItem);
    fs.writeFileSync(communityFile, JSON.stringify(currentItems, null, 2));

    return res.json({ success: true, item: newItem });
  } catch (err) {
    console.error('Error saving uploaded background:', err);
    return res.status(500).json({ success: false, error: 'Failed to save background' });
  }
});

// Vite Middleware for development
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WordsOfLife server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
