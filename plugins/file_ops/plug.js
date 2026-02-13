import fs from 'fs-extra';
import path from 'path';
const PROJECT_ROOT = process.cwd();



function isPathSafe(filePath) {
    const resolved = path.resolve(filePath);
    return resolved.startsWith(PROJECT_ROOT);
}

async function read_file(ctx, args) {
    try {
        const { path: filePath } = args;

        if (!filePath) {
            return "Error: File path is required";
        }

        if (!isPathSafe(filePath)) {
            return "Error: Access denied - path outside project directory";
        }

        const content = await fs.readFile(filePath, 'utf-8');



        if (content.length > 2000) {
            return `File: ${filePath}\n\n${content.substring(0, 2000)}...\n\n[File truncated - ${content.length} total characters]`;
        }

        return `File: ${filePath}\n\n${content}`;
    } catch (error) {
        return `Error reading file: ${error.message}`;
    }
}





async function list_dir(ctx, args) {
    try {
        const dirPath = args.path || '.';

        if (!isPathSafe(dirPath)) {
            return "Error: Access denied - path outside project directory";
        }

        const items = await fs.readdir(dirPath, { withFileTypes: true });

        let output = `📁 Directory: ${path.resolve(dirPath)}\n\n`;

        const dirs = items.filter(item => item.isDirectory());
        const files = items.filter(item => item.isFile());

        if (dirs.length > 0) {
            output += "**Directories:**\n";
            dirs.forEach(dir => {
                output += `📂 ${dir.name}/\n`;
            });
            output += "\n";
        }

        if (files.length > 0) {
            output += "**Files:**\n";
            for (const file of files) {
                const filePath = path.join(dirPath, file.name);
                const stats = await fs.stat(filePath);
                const size = stats.size < 1024
                    ? `${stats.size}B`
                    : stats.size < 1024 * 1024
                        ? `${(stats.size / 1024).toFixed(1)}KB`
                        : `${(stats.size / 1024 / 1024).toFixed(1)}MB`;
                output += `📄 ${file.name} (${size})\n`;
            }
        }

        output += `\nTotal: ${dirs.length} directories, ${files.length} files`;

        return output;
    } catch (error) {
        return `Error listing directory: ${error.message}`;
    }
}




async function write_file(ctx, args) {
    try {
        const { path: filePath, content } = args;

        if (!filePath || content === undefined) {
            return "Error: Both path and content are required";
        }

        if (!isPathSafe(filePath)) {
            return "Error: Access denied - path outside project directory";
        }


        await fs.ensureDir(path.dirname(filePath));

        await fs.writeFile(filePath, content, 'utf-8');

        return `✅ Successfully wrote ${content.length} characters to ${filePath}`;
    } catch (error) {
        return `Error writing file: ${error.message}`;
    }
}




export default {
    read_file,
    list_dir,
    write_file
};
