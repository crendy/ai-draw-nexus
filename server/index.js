import express from 'express';
import cors from 'cors';
import fs from 'fs-extra';
import path from 'path';
import {fileURLToPath} from 'url';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import {v4 as uuidv4} from 'uuid';
import {parseHTML} from 'linkedom';
import {Readability} from '@mozilla/readability';
import TurndownService from 'turndown';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
const devVarsPath = path.join(__dirname, '../.dev.vars');
const envPath = path.join(__dirname, '../.env');

if (fs.existsSync(devVarsPath)) {
  dotenv.config({ path: devVarsPath });
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- Storage Configuration ---
let DATA_DIR = process.env.DATA_DIR || '/app/data';

try {
  fs.ensureDirSync(DATA_DIR);
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
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const VERSIONS_DIR = path.join(DATA_DIR, 'versions');

fs.ensureDirSync(VERSIONS_DIR);

// --- Helpers ---
function isWechatArticle(url) {
  return url.includes('mp.weixin.qq.com');
}

function preprocessWechatArticle(document) {
  const jsContent = document.getElementById('js_content');
  if (jsContent) {
    jsContent.style.visibility = 'visible';
    jsContent.style.display = 'block';
  }

  const images = document.querySelectorAll('img[data-src]');
  images.forEach((img) => {
    const dataSrc = img.getAttribute('data-src');
    if (dataSrc) {
      img.setAttribute('src', dataSrc);
    }
  });

  const removeSelectors = [
    '#js_pc_qr_code',
    '#js_profile_qrcode',
    '.qr_code_pc_outer',
    '.rich_media_area_extra',
    '.reward_area',
    '#js_tags',
    '.original_area_primary',
    '.original_area_extra',
  ];
  removeSelectors.forEach((selector) => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => el.remove());
  });
}

function extractWechatContent(document) {
  const titleEl = document.getElementById('activity-name') ||
                  document.querySelector('.rich_media_title') ||
                  document.querySelector('h1');
  const title = titleEl?.textContent?.trim() || '微信公众号文章';

  const contentEl = document.getElementById('js_content') ||
                    document.querySelector('.rich_media_content');

  if (!contentEl) {
    return null;
  }

  return { title, content: contentEl.innerHTML };
}

async function getUsers() {
  try {
    if (await fs.pathExists(USERS_FILE)) {
      return await fs.readJson(USERS_FILE);
    }
    return [];
  } catch (err) {
    console.error('Error reading users:', err);
    return [];
  }
}

async function saveUsers(users) {
  await fs.writeJson(USERS_FILE, users, { spaces: 2 });
}

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

// --- Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- Auth Routes ---
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const users = await getUsers();
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = { id: uuidv4(), username, password: hashedPassword, createdAt: new Date().toISOString() };

  users.push(user);
  await saveUsers(users);

  res.status(201).json({ message: 'User created successfully' });
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const users = await getUsers();
  const user = users.find(u => u.username === username);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, username: user.username } });
});

app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new passwords are required' });
  }

  const users = await getUsers();
  const userIndex = users.findIndex(u => u.id === req.user.id);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = users[userIndex];
  const isValid = await bcrypt.compare(currentPassword, user.password);

  if (!isValid) {
    return res.status(400).json({ error: 'Invalid current password' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  users[userIndex] = { ...user, password: hashedPassword };
  await saveUsers(users);

  res.json({ message: 'Password updated successfully' });
});

// --- Protected API Routes ---

// Groups
app.get('/api/groups', authenticateToken, async (req, res) => {
  const groups = await getGroups();
  const userGroups = groups.filter(g => g.userId === req.user.id);
  userGroups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(userGroups);
});

app.post('/api/groups', authenticateToken, async (req, res) => {
  const group = { ...req.body, userId: req.user.id };
  const groups = await getGroups();
  groups.push(group);
  await saveGroups(groups);
  res.status(201).json(group);
});

app.put('/api/groups/:id', authenticateToken, async (req, res) => {
  const groups = await getGroups();
  const index = groups.findIndex(g => g.id === req.params.id && g.userId === req.user.id);
  if (index !== -1) {
    groups[index] = { ...groups[index], ...req.body };
    await saveGroups(groups);
    res.json(groups[index]);
  } else {
    res.status(404).json({ error: 'Group not found' });
  }
});

app.delete('/api/groups/:id', authenticateToken, async (req, res) => {
  const groups = await getGroups();
  const groupIndex = groups.findIndex(g => g.id === req.params.id && g.userId === req.user.id);

  if (groupIndex === -1) {
    return res.status(404).json({ error: 'Group not found' });
  }

  const newGroups = groups.filter(g => g.id !== req.params.id);
  await saveGroups(newGroups);

  // Move projects in this group to 'Uncategorized' (remove groupId)
  const projects = await getProjects();
  let projectsChanged = false;
  projects.forEach(p => {
    if (p.groupId === req.params.id && p.userId === req.user.id) {
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
app.get('/api/projects', authenticateToken, async (req, res) => {
  const projects = await getProjects();
  const userProjects = projects.filter(p => p.userId === req.user.id);
  userProjects.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json(userProjects);
});

app.get('/api/projects/:id', authenticateToken, async (req, res) => {
  const projects = await getProjects();
  const project = projects.find(p => p.id === req.params.id && p.userId === req.user.id);
  if (project) res.json(project);
  else res.status(404).json({ error: 'Project not found' });
});

app.post('/api/projects', authenticateToken, async (req, res) => {
  const project = { ...req.body, userId: req.user.id };
  const projects = await getProjects();
  projects.push(project);
  await saveProjects(projects);
  res.status(201).json(project);
});

app.put('/api/projects/:id', authenticateToken, async (req, res) => {
  const projects = await getProjects();
  const index = projects.findIndex(p => p.id === req.params.id && p.userId === req.user.id);
  if (index !== -1) {
    projects[index] = { ...projects[index], ...req.body };
    await saveProjects(projects);
    res.json(projects[index]);
  } else {
    res.status(404).json({ error: 'Project not found' });
  }
});

app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
  const projects = await getProjects();
  const projectIndex = projects.findIndex(p => p.id === req.params.id && p.userId === req.user.id);

  if (projectIndex === -1) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const newProjects = projects.filter(p => p.id !== req.params.id);
  await saveProjects(newProjects);

  const versionFile = path.join(VERSIONS_DIR, `${req.params.id}.json`);
  if (await fs.pathExists(versionFile)) {
    await fs.remove(versionFile);
  }
  res.status(204).send();
});

// Versions
// Note: Versions are tied to projects, so we check project ownership first
app.get('/api/projects/:id/versions', authenticateToken, async (req, res) => {
  const projects = await getProjects();
  const project = projects.find(p => p.id === req.params.id && p.userId === req.user.id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const versions = await getVersions(req.params.id);
  versions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json(versions);
});

app.get('/api/projects/:id/versions/latest', authenticateToken, async (req, res) => {
  const projects = await getProjects();
  const project = projects.find(p => p.id === req.params.id && p.userId === req.user.id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const versions = await getVersions(req.params.id);
  if (versions.length > 0) {
    versions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(versions[0]);
  } else {
    res.status(404).json({ error: 'No versions found' });
  }
});

app.post('/api/projects/:id/versions', authenticateToken, async (req, res) => {
  const projects = await getProjects();
  const project = projects.find(p => p.id === req.params.id && p.userId === req.user.id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const version = req.body;
  const versions = await getVersions(req.params.id);
  versions.push(version);
  await saveVersions(req.params.id, versions);
  res.status(201).json(version);
});

app.put('/api/projects/:id/versions/latest', authenticateToken, async (req, res) => {
  const projects = await getProjects();
  const project = projects.find(p => p.id === req.params.id && p.userId === req.user.id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

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

app.delete('/api/projects/:id/versions', authenticateToken, async (req, res) => {
  const projects = await getProjects();
  const project = projects.find(p => p.id === req.params.id && p.userId === req.user.id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const versionFile = path.join(VERSIONS_DIR, `${req.params.id}.json`);
  if (await fs.pathExists(versionFile)) {
    await fs.remove(versionFile);
  }
  res.status(204).send();
});

// --- AI Proxy ---
// Parse URL content
app.post('/api/parse-url', authenticateToken, async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: '请提供有效的URL' });
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return res.status(400).json({ error: 'URL格式无效' });
    }

    const isWechat = isWechatArticle(url);

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    };

    if (isWechat) {
      headers['Referer'] = 'https://mp.weixin.qq.com/';
    }

    const response = await fetch(url, { headers, redirect: 'follow' });

    if (!response.ok) {
      return res.status(502).json({ error: `无法获取页面内容: ${response.status}` });
    }

    const html = await response.text();
    const { document } = parseHTML(html);

    if (isWechat) {
      preprocessWechatArticle(document);
    }

    const reader = new Readability(document.cloneNode(true));
    let article = reader.parse();

    if (!article && isWechat) {
      const wechatContent = extractWechatContent(document);
      if (wechatContent) {
        article = {
          title: wechatContent.title,
          content: wechatContent.content,
          textContent: '',
          length: wechatContent.content.length,
          excerpt: '',
          byline: '',
          dir: '',
          siteName: '微信公众号',
          lang: 'zh-CN',
          publishedTime: null,
        };
      }
    }

    if (!article) {
      return res.status(422).json({ error: '无法解析页面内容，该页面可能不是文章类型' });
    }

    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
    });

    turndownService.addRule('removeEmptyLinks', {
      filter: (node) => node.nodeName === 'A' && !node.textContent?.trim(),
      replacement: () => '',
    });

    turndownService.addRule('wechatImages', {
      filter: (node) => node.nodeName === 'IMG',
      replacement: (_content, node) => {
        const src = node.getAttribute('src') || node.getAttribute('data-src') || '';
        const alt = node.getAttribute('alt') || '';
        return src ? `![${alt}](${src})` : '';
      },
    });

    const wrappedHtml = `<!DOCTYPE html><html><body>${article.content || ''}</body></html>`;
    const { document: contentDoc } = parseHTML(wrappedHtml);
    const markdown = turndownService.turndown(contentDoc.body);

    const siteName = isWechat ? '微信公众号' : parsedUrl.hostname;
    const fullMarkdown = `# ${article.title}\n\n> 来源: [${siteName}](${url})\n\n${markdown}`;

    res.json({
      success: true,
      data: {
        title: article.title,
        content: fullMarkdown,
        excerpt: article.excerpt,
        siteName: article.siteName || siteName,
        url: url,
      },
    });
  } catch (error) {
    console.error('Parse URL error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : '解析失败' });
  }
});

// Forward chat requests to the AI provider
app.post('/api/chat', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  const debug = process.env.DEBUG === 'true';
  if (debug) {
    // Truncate body if it's too large to avoid log spam/performance issues
    const bodyStr = JSON.stringify(req.body);
    const logStr = bodyStr.length > 1000 ? bodyStr.substring(0, 1000) + '...' : bodyStr;
    console.log('[AI Service] AI Chat Request Start:', logStr);
  }else{
    console.log('[AI Service] AI Chat Request Start.');
  }

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
      if (debug) {
        console.error('[AI Service] AI Provider Error:', errorText);
      }
      return res.status(response.status).json({ error: `AI Provider Error: ${errorText}` });
    }

    // Handle streaming response
    if (req.body.stream) {
      if (debug) {
        console.log('[AI Service] Starting stream response');
      }
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

      if (debug) {
        const duration = Date.now() - startTime;
        console.log(`[AI Service] Stream response completed. Duration: ${duration}ms`);
      }

      res.end();
    } else {
      const data = await response.json();
      if (debug) {
        const duration = Date.now() - startTime;
        console.log(`[AI Service] AI Response completed. (Duration: ${duration}ms):`, JSON.stringify(data));
      } else {
        console.log(`[AI Service] AI Response completed. Duration: ${duration}ms:`);
      }
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
  // Use a catch-all middleware instead of a route with wildcard to avoid path-to-regexp issues in Express 5
  app.use(async (req, res) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      try {
        let html = await fs.readFile(path.join(distPath, 'index.html'), 'utf-8');
        // Inject environment variables
        const envScript = `<script>window._ENV_ = { DEBUG: ${process.env.DEBUG === 'true'} };</script>`;
        html = html.replace('</head>', `${envScript}</head>`);
        res.send(html);
      } catch (err) {
        console.error('Error serving index.html:', err);
        res.status(500).send('Internal Server Error');
      }
    } else {
      res.status(404).json({ error: 'Not Found' });
    }
  });
} else {
  console.warn('Dist directory not found. Run `pnpm build` first.');
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

