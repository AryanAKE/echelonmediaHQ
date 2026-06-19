const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

const filesToProcess = ['public/index.html', 'public/content.html'];

// 1. Process HTML for CSS and Cursor
const cursorHTML = `
    <div class="custom-cursor">
        <svg viewBox="0 0 24 24"><path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2h6z"/></svg>
    </div>
`;
const cursorCSS = `
.custom-cursor {
    position: fixed;
    top: 0;
    left: 0;
    width: 30px;
    height: 30px;
    pointer-events: none;
    z-index: 999999;
    transform: translate(-50%, -50%);
    mix-blend-mode: difference;
    fill: white;
    display: flex;
    justify-content: center;
    align-items: center;
}
.custom-cursor svg {
    width: 20px;
    height: 20px;
}
body, a, button, input, textarea, select, .team-card-small, img[data-bs-toggle='modal'], .explore-btn, .social-link, .footer-social-link { 
    cursor: none !important; 
}
`;
const cursorJS = `
    <script>
        const cursor = document.querySelector('.custom-cursor');
        document.addEventListener('mousemove', e => {
            if(cursor) {
                cursor.style.transform = \`translate(\${e.clientX}px, \${e.clientY}px) translate(-50%, -50%)\`;
            }
        });
    </script>
`;

filesToProcess.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Extract CSS
    const styleRegex = /<style>([\s\S]*?)<\/style>/i;
    const match = content.match(styleRegex);
    if(match) {
        const cssContent = match[1] + '\n' + cursorCSS;
        const cssFile = file.replace('.html', '.css');
        fs.writeFileSync(cssFile, cssContent);
        content = content.replace(styleRegex, '<link rel="stylesheet" href="' + cssFile.split('/').pop() + '">');
    }
    
    // Add cursor HTML before </body>
    if(!content.includes('custom-cursor')) {
        content = content.replace('</body>', cursorHTML + '\n' + cursorJS + '\n</body>');
    }
    
    fs.writeFileSync(file, content);
    console.log(`Processed ${file}`);
});

// 2. Compress Images using sharp
const imgDir = path.join(__dirname, 'public/assets/img');

function compressImages(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            compressImages(fullPath);
        } else if (fullPath.match(/\.(png|jpg|jpeg)$/i)) {
            // Compress in place by outputting to temp file then renaming
            const tempPath = fullPath + '.tmp';
            sharp(fullPath)
                .resize({ width: 1920, withoutEnlargement: true }) // limit max dimension
                .jpeg({ quality: 80, force: false })
                .png({ compressionLevel: 9, quality: 80, force: false })
                .toFile(tempPath)
                .then(() => {
                    fs.unlinkSync(fullPath);
                    fs.renameSync(tempPath, fullPath);
                    console.log(`Compressed: ${file}`);
                })
                .catch(err => {
                    console.error(`Error compressing ${file}: ${err}`);
                    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                });
        }
    });
}

compressImages(imgDir);
