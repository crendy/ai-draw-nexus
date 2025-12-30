import express from 'express';
import cors from 'cors';
import fs from 'fs-extra';
import path from 'path';
import {fileURLToPath} from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
// Try loading from .dev.vars first (Wrangler format), then .env
const devVarsPath = path.join(__dirname, '../.dev.vars');
const envPath = path.join(__dirname, '../.env');

if (fs.existsSync(devVarsPath)) {
  dotenv.config({ path: devVarsPath });
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- Storage Configuration ---
// In Docker, we will mount a volume to /app/data
// Locally, we fallback to ./data/aidraw
let DATA_DIR = process.env.DATA_DIR || '/app/data';

try {
  fs.ensureDirSync(DATA_DIR);
  // Test write
  const testFile = path.join(DATA_DIR, '.test');
  fs.writeFileSync(testFile, 'test');
  fs.removeSync(testFile);
  console.log(`Using storage directory: ${DATA_DIR}`);
} catch (err) {
  console.warn(`Cannot write to ${DATA_DIR}, falling back to local ./data/aidraw`);
  DATA_DIR = path.join(process.cwd(), 'data', 'aidraw');
  fs.ensureDirSync(DATA_DIR);
  console.log(`Using storage directory: ${DATA_DIR}`);
}

const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const GROUPS_FILE = path.join(DATA_DIR, 'groups.json');
const VERSIONS_DIR = path.join(DATA_DIR, 'versions');

fs.ensureDirSync(VERSIONS_DIR);

// --- Helpers ---
async function getProjects() {
  try {
    if (await fs.pathExists(PROJECTS_FILE)) {
      return await fs.readJson(PROJECTS_FILE);
    }
    return [];
  } catch (err) {
    console.error('Error reading projects:', err);
    return [];
  }
}

async function saveProjects(projects) {
  await fs.writeJson(PROJECTS_FILE, projects, { spaces: 2 });
}

async function getGroups() {
  try {
    if (await fs.pathExists(GROUPS_FILE)) {
      return await fs.readJson(GROUPS_FILE);
    }
    return [];
  } catch (err) {
    console.error('Error reading groups:', err);
    return [];
  }
}

async function saveGroups(groups) {
  await fs.writeJson(GROUPS_FILE, groups, { spaces: 2 });
}

async function getVersions(projectId) {
  const file = path.join(VERSIONS_DIR, `${projectId}.json`);
  try {
    if (await fs.pathExists(file)) {
      return await fs.readJson(file);
    }
    return [];
  } catch (err) {
    return [];
  }
}

async function saveVersions(projectId, versions) {
  const file = path.join(VERSIONS_DIR, `${projectId}.json`);
  await fs.writeJson(file, versions, { spaces: 2 });
}

// --- API Routes ---

// Groups
app.get('/api/groups', async (req, res) => {
  const groups = await getGroups();
  groups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(groups);
});

app.post('/api/groups', async (req, res) => {
  const group = req.body;
  const groups = await getGroups();
  groups.push(group);
  await saveGroups(groups);
  res.status(201).json(group);
});

app.put('/api/groups/:id', async (req, res) => {
  const groups = await getGroups();
  const index = groups.findIndex(g => g.id === req.params.id);
  if (index !== -1) {
    groups[index] = { ...groups[index], ...req.body };
    await saveGroups(groups);
    res.json(groups[index]);
  } else {
    res.status(404).json({ error: 'Group not found' });
  }
});

app.delete('/api/groups/:id', async (req, res) => {
  const groups = await getGroups();
  const newGroups = groups.filter(g => g.id !== req.params.id);
  await saveGroups(newGroups);

  // Move projects in this group to 'Uncategorized' (remove groupId)
  const projects = await getProjects();
  let projectsChanged = false;
  projects.forEach(p => {
    if (p.groupId === req.params.id) {
      delete p.groupId;
      projectsChanged = true;
    }
  });

  if (projectsChanged) {
    await saveProjects(projects);
  }

  res.status(204).send();
});

// Projects
app.get('/api/projects', async (req, res) => {
  const projects = await getProjects();
  projects.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json(projects);
});

app.get('/api/projects/:id', async (req, res) => {
  const projects = await getProjects();
  const project = projects.find(p => p.id === req.params.id);
  if (project) res.json(project);
  else res.status(404).json({ error: 'Project not found' });
});

app.post('/api/projects', async (req, res) => {
  const project = req.body;
  const projects = await getProjects();
  projects.push(project);
  await saveProjects(projects);
  res.status(201).json(project);
});

app.put('/api/projects/:id', async (req, res) => {
  const projects = await getProjects();
  const index = projects.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    projects[index] = { ...projects[index], ...req.body };
    await saveProjects(projects);
    res.json(projects[index]);
  } else {
    res.status(404).json({ error: 'Project not found' });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  const projects = await getProjects();
  const newProjects = projects.filter(p => p.id !== req.params.id);
  await saveProjects(newProjects);

  const versionFile = path.join(VERSIONS_DIR, `${req.params.id}.json`);
  if (await fs.pathExists(versionFile)) {
    await fs.remove(versionFile);
  }
  res.status(204).send();
});

// Versions
app.get('/api/projects/:id/versions', async (req, res) => {
  const versions = await getVersions(req.params.id);
  versions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json(versions);
});

app.get('/api/projects/:id/versions/latest', async (req, res) => {
  const versions = await getVersions(req.params.id);
  if (versions.length > 0) {
    versions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(versions[0]);
  } else {
    res.status(404).json({ error: 'No versions found' });
  }
});

app.post('/api/projects/:id/versions', async (req, res) => {
  const version = req.body;
  const versions = await getVersions(req.params.id);
  versions.push(version);
  await saveVersions(req.params.id, versions);
  res.status(201).json(version);
});

app.put('/api/projects/:id/versions/latest', async (req, res) => {
  const versions = await getVersions(req.params.id);
  if (versions.length > 0) {
    versions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const latest = versions[0];
    latest.content = req.body.content;

    const index = versions.findIndex(v => v.id === latest.id);
    if (index !== -1) versions[index] = latest;

    await saveVersions(req.params.id, versions);
    res.json(latest);
  } else {
    res.status(404).json({ error: 'No versions found' });
  }
});

app.delete('/api/projects/:id/versions', async (req, res) => {
  const versionFile = path.join(VERSIONS_DIR, `${req.params.id}.json`);
  if (await fs.pathExists(versionFile)) {
    await fs.remove(versionFile);
  }
  res.status(204).send();
});

// --- AI Proxy ---
// Forward chat requests to the AI provider
app.post('/api/chat', async (req, res) => {
  try {
    // In a real implementation, you would use the AI provider SDK or fetch here
    // For now, we'll return a mock response or error if not configured
    // Since we removed Cloudflare Functions, we need to implement this logic in Node.js
    // or forward to an external service.

    // Check if we have API keys in environment variables
    const apiKey = process.env.AI_API_KEY;
    const apiBaseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
    const modelId = process.env.AI_MODEL_ID || 'gpt-3.5-turbo';

    if (!apiKey) {
      return res.status(500).json({ error: 'AI_API_KEY not configured on server' });
    }

    const response = await fetch(`${apiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelId,
        messages: req.body.messages,
        stream: req.body.stream
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `AI Provider Error: ${errorText}` });
    }

    // Handle streaming response
    if (req.body.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        res.write(chunk);
      }
      res.end();
    } else {
      const data = await response.json();
      // Adapt response format to what frontend expects
      const content = data.choices?.[0]?.message?.content || '';
      res.json({ content });
    }
  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Static Files (Frontend) ---
// Serve static files from the 'dist' directory
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // Handle SPA routing: return index.html for any unknown route
  app.get(/.*/, (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    } else {
      res.status(404).json({ error: 'API endpoint not found' });
    }
  });
} else {
  console.warn('Dist directory not found. Run `pnpm build` first.');
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

