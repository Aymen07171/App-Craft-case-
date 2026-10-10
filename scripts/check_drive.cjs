const https = require('https');

https.get('https://drive.google.com/drive/folders/108aZnUBJ64BJdeaF6DTou9U5tyrthksO', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    const titleMatch = data.match(/<title>([^<]+)<\/title>/);
    console.log('Title:', titleMatch ? titleMatch[1] : 'none');
    
    // Look for image filenames in page bootstrap data
    const filenameRegex = /([a-zA-Z0-9_\-\s]+\.(png|jpg|jpeg|webp))/gi;
    const found = new Set();
    let m;
    while ((m = filenameRegex.exec(data)) !== null) {
      if (!m[1].includes('drive') && !m[1].includes('google') && !m[1].includes('icon') && !m[1].includes('logo')) {
        found.add(m[1]);
      }
    }
    console.log('Detected filenames in Drive page bootstrap:');
    console.log(Array.from(found));
  });
}).on('error', e => console.error(e));
