import os from 'os';
import { execSync } from 'child_process';

async function get_stats(ctx, args) {
    try {

        const cpus = os.cpus();
        const cpuModel = cpus[0].model;
        const cpuCores = cpus.length;





        const cpuUsage = cpus.reduce((acc, cpu) => {
            const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
            const idle = cpu.times.idle;
            return acc + ((total - idle) / total) * 100;
        }, 0) / cpus.length;





        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const memUsagePercent = (usedMem / totalMem) * 100;






        let diskInfo = 'N/A';
        try {
            const df = execSync('df -h / | tail -1').toString().trim();
            const parts = df.split(/\s+/);
            diskInfo = `${parts[2]} used / ${parts[1]} total (${parts[4]} used)`;
        } catch (e) {
            diskInfo = 'Unable to fetch disk info';
        }

        const uptime = os.uptime();
        const uptimeHours = Math.floor(uptime / 3600);
        const uptimeMinutes = Math.floor((uptime % 3600) / 60);

        const processUptime = process.uptime();
        const processUptimeMinutes = Math.floor(processUptime / 60);
        const memoryUsage = process.memoryUsage();


        const stats = `
📊 **System Statistics**

**CPU:**
• Model: ${cpuModel}
• Cores: ${cpuCores}
• Usage: ${cpuUsage.toFixed(2)}%

**Memory:**
• Total: ${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB
• Used: ${(usedMem / 1024 / 1024 / 1024).toFixed(2)} GB
• Free: ${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB
• Usage: ${memUsagePercent.toFixed(2)}%

**Disk:**
• ${diskInfo}

**System:**
• Platform: ${os.platform()} ${os.arch()}
• Hostname: ${os.hostname()}
• Uptime: ${uptimeHours}h ${uptimeMinutes}m

**Bot Process:**
• Node.js: ${process.version}
• PID: ${process.pid}
• Uptime: ${processUptimeMinutes}m
• Memory: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB
`;

        return stats.trim();
    } catch (error) {
        return `Error fetching system stats: ${error.message}`;
    }
}

export default {
    get_stats
};
