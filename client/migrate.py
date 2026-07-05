import os
import re
import sys

# Define JS/TS keywords and standard built-ins to filter out from dependency analysis
KEYWORDS = {
    'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do',
    'else', 'export', 'import', 'extends', 'finally', 'for', 'function', 'if', 'import', 'in',
    'instanceof', 'new', 'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var',
    'void', 'while', 'with', 'yield', 'let', 'static', 'enum', 'await', 'implements', 'package',
    'protected', 'interface', 'private', 'public', 'type', 'of', 'null', 'undefined', 'true', 'false',
    'window', 'document', 'console', 'localStorage', 'sessionStorage', 'fetch', 'Headers', 'Request',
    'Response', 'URL', 'URLSearchParams', 'performance', 'Math', 'Date', 'JSON', 'Error', 'setTimeout',
    'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame', 'cancelAnimationFrame',
    'IntersectionObserver', 'HTMLElement', 'Element', 'HeadersInit', 'RequestInit', 'Promise', 'Object',
    'Array', 'String', 'Number', 'Boolean', 'RegExp', 'Map', 'Set', 'window.App', 'ReactDOM', 'React',
    'any', 'string', 'number', 'boolean', 'void', 'never', 'unknown', 'undefined', 'null', 'Object.assign'
}

REACT_HOOKS = {
    'useState', 'useEffect', 'useRef', 'useLayoutEffect', 'useCallback', 'useMemo', 'useContext',
    'useReducer', 'useImperativeHandle', 'useDebugValue', 'useDeferredValue', 'useTransition',
    'useId', 'Fragment', 'StrictMode'
}

def get_relative_import_path(from_path, to_path):
    from_dir = os.path.dirname(from_path)
    rel_path = os.path.relpath(to_path, from_dir)
    # Strip extension
    base, ext = os.path.splitext(rel_path)
    if ext in ['.ts', '.tsx']:
        rel_path = base
    if not rel_path.startswith('.') and not rel_path.startswith('/'):
        rel_path = './' + rel_path
    return rel_path

def parse_declarations(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Simple parser to track nesting level and find top-level declarations
    declarations = set()
    lines = content.split('\n')

    # Regexes for declarations (no leading whitespace allowed)
    decl_re = re.compile(r'^(?:const|let|var|function|class|enum|interface|type)\s+([A-Za-z0-9_]+)')
    destruct_re = re.compile(r'^(?:const|let|var)\s+\{\s*([A-Za-z0-9_,\s\n]+)\s*\}')

    for line in lines:
        if not line:
            continue

        # Match against unstripped line (requires no leading whitespace)
        m = decl_re.match(line)
        if m:
            symbol = m.group(1)
            if symbol not in ['default', 'import', 'export'] and symbol not in KEYWORDS and symbol not in REACT_HOOKS:
                declarations.add(symbol)
        else:
            m = destruct_re.match(line)
            if m:
                symbols = [s.strip() for s in m.group(1).split(',')]
                for s in symbols:
                    if s and s[0].isalpha():
                        if ':' in s:
                            s = s.split(':')[1].strip()
                        if s not in KEYWORDS and s not in REACT_HOOKS:
                            declarations.add(s)

    return declarations

def main():
    src_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'src'))
    
    # Step 1: Scan all files and find all top-level declarations
    all_files = []
    symbol_to_file = {}
    file_to_decls = {}

    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                if file.endswith('.d.ts'):
                    continue
                file_path = os.path.join(root, file)
                all_files.append(file_path)
                decls = parse_declarations(file_path)
                file_to_decls[file_path] = decls
                for d in decls:
                    symbol_to_file[d] = file_path

    print(f"Scanned {len(all_files)} files.")
    print(f"Found {len(symbol_to_file)} unique declarations across all files.")

    # Step 2: Refactor each file
    for file_path in all_files:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        filename = os.path.basename(file_path)
        print(f"Processing {filename}...")

        # Find all word tokens in the file content
        words = set(re.findall(r'\b[A-Za-z_][A-Za-z0-9_]*\b', content))
        
        # Determine external symbols used in this file
        local_decls = file_to_decls[file_path]
        external_symbols_used = set()
        for w in words:
            if w in symbol_to_file:
                # If it's defined in another file, and not defined in this file
                if symbol_to_file[w] != file_path and w not in local_decls:
                    external_symbols_used.add(w)

        # Detect React usage and React Hooks destructuring:
        # e.g., var { useState, useEffect } = React;
        # We will replace it with a clean import
        react_destructure_pat = re.compile(r'^(?:var|const|let)\s+\{\s*([A-Za-z0-9_,\s\n]+)\s*\}\s*=\s*React\s*;?', re.MULTILINE)
        used_hooks = set()
        
        def destructure_replacer(match):
            hooks = [h.strip() for h in match.group(1).split(',')]
            for h in hooks:
                if h:
                    used_hooks.add(h)
            return "" # Remove the line completely
        
        cleaned_content, num_replacements = react_destructure_pat.subn(destructure_replacer, content)

        # Also scan for any hooks used in the file
        for hook in REACT_HOOKS:
            if re.search(r'\b' + hook + r'\b', cleaned_content):
                used_hooks.add(hook)

        # Check if React or ReactDOM is referenced in any way
        uses_react = "React" in words or "React.Fragment" in content or len(used_hooks) > 0 or "<" in content
        uses_react_dom = "ReactDOM" in words

        # Prepend 'export ' to top-level declarations that don't have it
        lines = cleaned_content.split('\n')
        new_lines = []
        decl_pattern = re.compile(r'^((?:const|let|var|function|class|enum|interface|type)\s+([A-Za-z0-9_]+))')

        for line in lines:
            # If line starts at the beginning with no indentation, prepended with export
            m = decl_pattern.match(line)
            if m:
                line = 'export ' + line
            
            new_lines.append(line)

        cleaned_content = '\n'.join(new_lines)

        # Remove Object.assign(window, ...) or window.X = X;
        cleaned_content = re.sub(r'Object\.assign\(\s*window\s*,\s*\{[^}]*\}\s*\)\s*;?', '', cleaned_content)
        cleaned_content = re.sub(r'window\.[A-Za-z0-9_]+\s*=\s*[A-Za-z0-9_]+\s*;?', '', cleaned_content)
        
        # Remove any leading ts-nocheck if we want, or keep it. Let's keep it.

        # Generate import statements
        imports_by_file = {}
        for sym in external_symbols_used:
            target_path = symbol_to_file[sym]
            rel_import = get_relative_import_path(file_path, target_path)
            if rel_import not in imports_by_file:
                imports_by_file[rel_import] = set()
            imports_by_file[rel_import].add(sym)

        import_lines = []
        
        # React imports
        if uses_react:
            if used_hooks:
                sorted_hooks = sorted(list(used_hooks))
                import_lines.append(f"import React, {{ {', '.join(sorted_hooks)} }} from 'react';")
            else:
                import_lines.append("import React from 'react';")
        
        if uses_react_dom:
            import_lines.append("import ReactDOM from 'react-dom/client';")

        # Workspace relative imports
        for rel_path, syms in sorted(imports_by_file.items()):
            sorted_syms = sorted(list(syms))
            import_lines.append(f"import {{ {', '.join(sorted_syms)} }} from '{rel_path}';")

        if import_lines:
            import_header = '\n'.join(import_lines) + '\n\n'
            # Insert after // @ts-nocheck or at the very top
            if cleaned_content.startswith('// @ts-nocheck'):
                idx = cleaned_content.find('\n') + 1
                cleaned_content = cleaned_content[:idx] + import_header + cleaned_content[idx:]
            else:
                cleaned_content = import_header + cleaned_content

        # Write the updated content back to the file
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(cleaned_content)

    print("Migration of source files to ES Modules completed successfully!")

if __name__ == '__main__':
    main()
