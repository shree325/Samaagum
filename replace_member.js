const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    const fullPath = path.resolve(__dirname, filePath);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // specifically replace 'member' (with single quotes) with 'registered_user'
    content = content.replace(/'member'/g, "'registered_user'");
    
    fs.writeFileSync(fullPath, content);
    console.log(`Updated ${filePath}`);
}

replaceInFile('server/src/services/EventService.ts');
replaceInFile('client/src/EventMembersTab.tsx');
replaceInFile('client/src/event.tsx');
