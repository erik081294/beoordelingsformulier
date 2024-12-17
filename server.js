const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config();

const app = express();
const port = 3000;

// Serve static files from src directory
app.use(express.static('src'));

app.get('/', (req, res) => {
    // Read the HTML file from src/score directory
    let html = fs.readFileSync(path.join(__dirname, 'src', 'score', 'index.html'), 'utf8');
    
    // Create the environment variables script
    const envScript = `
    <script>
        window.ENV = {
            SUPABASE_URL: "${process.env.SUPABASE_URL}",
            SUPABASE_KEY: "${process.env.SUPABASE_KEY}"
        };
    </script>`;
    
    // Insert the environment variables script before the closing body tag
    html = html.replace('</body>', `${envScript}\n</body>`);
    
    res.send(html);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 