const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Configuration
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGODB_URI;
const DATA_DIR = path.join(__dirname, 'data');
const MENU_FILE = path.join(DATA_DIR, 'menu_data.json');
const RESTAURANT_FILE = path.join(DATA_DIR, 'restaurant.json');

// --- MongoDB Schemas ---
const restaurantSchema = new mongoose.Schema({
    name: String,
    slogan: String,
    colors: Object,
    contact: Object,
    trust: Object,
    currency: String
}, { strict: false });

const menuSchema = new mongoose.Schema({
    id: String,
    name: String,
    items: Array
}, { strict: false });

const Restaurant = mongoose.model('Restaurant', restaurantSchema);
const Menu = mongoose.model('Menu', menuSchema);

// Connection Logic
let isMongo = false;
async function connectDB() {
    if (MONGO_URI) {
        try {
            await mongoose.connect(MONGO_URI);
            isMongo = true;
            console.log("CONNECTED TO CLOUD DATABASE (MONGODB)");
        } catch (err) {
            console.log("DB CONNECTION FAILED, FALLING BACK TO FILES", err);
        }
    }
}
connectDB();

// Ensure Data Exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

// Handle specific directory/file conflict for menu_data.json
if (fs.existsSync(MENU_FILE) && fs.lstatSync(MENU_FILE).isDirectory()) {
    console.log("Cleaning up menu_data.json directory conflict...");
    fs.rmSync(MENU_FILE, { recursive: true, force: true });
}

// Default Data
const defaultRestaurant = {
    name: "Lumina Lounge",
    slogan: "Taste the Modern Vibe",
    description: "Premium steaks, artisan coffees, and a relaxed atmosphere.",
    colors: { primary: "#fbbf24", background: "#0f172a", text: "#f8fafc" },
    contact: { whatsapp: "+201234567890", socials: { facebook: "#" } },
    currency: "EGP"
};

const defaultMenu = [
    {
        id: "cat_1", name: "Starters",
        items: [{ id: "i1", name: "Bruschetta", price: 90, description: "Grilled bread garlic tomato", image: "https://images.unsplash.com/photo-1572695157369-24d29ca1653d?w=500" }]
    }
];

if (!fs.existsSync(RESTAURANT_FILE)) fs.writeFileSync(RESTAURANT_FILE, JSON.stringify(defaultRestaurant, null, 2));
if (!fs.existsSync(MENU_FILE)) fs.writeFileSync(MENU_FILE, JSON.stringify(defaultMenu, null, 2));

// Simple HTTP Server (No dependencies needed!)
const http = require('http');

const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);

    // API Routes
    if (url.pathname === '/api/load' && req.method === 'GET') {
        try {
            let restaurant, menu;

            if (isMongo) {
                restaurant = await Restaurant.findOne();
                menu = await Menu.find();

                // Seed if empty
                if (!restaurant) {
                    const localRest = JSON.parse(fs.readFileSync(RESTAURANT_FILE, 'utf8'));
                    restaurant = await Restaurant.create(localRest);
                }
                if (menu.length === 0) {
                    const localMenu = JSON.parse(fs.readFileSync(MENU_FILE, 'utf8'));
                    await Menu.insertMany(localMenu);
                    menu = await Menu.find();
                }
            } else {
                restaurant = JSON.parse(fs.readFileSync(RESTAURANT_FILE, 'utf8'));
                menu = JSON.parse(fs.readFileSync(MENU_FILE, 'utf8'));
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ restaurant, menu }));
        } catch (error) {
            console.error("Load Error:", error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Failed to load data" }));
        }
        return;
    }

    // Analytics: Track Item Click
    if (url.pathname === '/api/track-view' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            const { itemId } = JSON.parse(body);
            let menu = JSON.parse(fs.readFileSync(MENU_FILE, 'utf8'));
            menu.forEach(cat => {
                cat.items.forEach(item => {
                    if (item.id === itemId) {
                        item.views = (item.views || 0) + 1;
                    }
                });
            });
            fs.writeFileSync(MENU_FILE, JSON.stringify(menu, null, 2));
            res.end(JSON.stringify({ success: true }));
        });
        return;
    }

    if (url.pathname === '/api/menu' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                if (isMongo) {
                    await Menu.deleteMany({});
                    await Menu.insertMany(data);
                } else {
                    fs.writeFileSync(MENU_FILE, JSON.stringify(data, null, 2));
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "Failed to save menu" }));
            }
        });
        return;
    }

    if (url.pathname === '/api/restaurant' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                if (isMongo) {
                    await Restaurant.findOneAndUpdate({}, data, { upsert: true });
                } else {
                    const current = JSON.parse(fs.readFileSync(RESTAURANT_FILE, 'utf8'));
                    fs.writeFileSync(RESTAURANT_FILE, JSON.stringify({ ...current, ...data }, null, 2));
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "Failed to save restaurant info" }));
            }
        });
        return;
    }

    // Static Files
    let baseDir = path.join(__dirname, '../frontend');
    let targetPath = url.pathname;

    if (url.pathname.startsWith('/admin')) {
        baseDir = path.join(__dirname, '../admin');
        targetPath = url.pathname.replace('/admin', '');
        if (targetPath === '' || targetPath === '/') targetPath = '/index.html';
    }

    let filePath = path.join(baseDir, targetPath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code == 'ENOENT') {
                res.writeHead(404);
                res.end('404 Not Found');
            } else {
                res.writeHead(500);
                res.end('500 Server Error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log('========================================');
    console.log(`  🚀 PREMIUM QR MENU SYSTEM V2`);
    console.log(`  PORT: ${PORT}`);
    console.log(`  DATABASE: ${isMongo ? 'CLOUD (MONGODB)' : 'LOCAL (JSON)'}`);
    console.log(`  ADMIN: http://localhost:${PORT}/admin`);
    console.log('========================================');
});
