const fs = require('fs');
const path = require('path');

// 1. Update DEFAULT_FREE_ENTITLEMENTS in server
const planEntitlementsPath = path.join(__dirname, 'server', 'src', 'types', 'PlanEntitlements.ts');
if (fs.existsSync(planEntitlementsPath)) {
    let content = fs.readFileSync(planEntitlementsPath, 'utf8');
    content = content.replace(/ai_assistant_enabled:\s*false,/g, 'ai_assistant_enabled: true,');
    fs.writeFileSync(planEntitlementsPath, content);
    console.log('Updated PlanEntitlements.ts');
}

// 2. Replace group_member with registered_user in client/src
const clientSrcDir = path.join(__dirname, 'client', 'src');

function replaceInDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            replaceInDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('group_member')) {
                // We'll replace both single and double quotes
                content = content.replace(/'group_member'/g, "'registered_user'");
                content = content.replace(/"group_member"/g, '"registered_user"');
                
                // Some files might have Label mappings like:
                // 'registered_user': 'Member'
                
                fs.writeFileSync(fullPath, content);
                console.log('Updated ' + fullPath);
            }
        }
    }
}

replaceInDir(clientSrcDir);
