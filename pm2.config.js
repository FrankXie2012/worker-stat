const env = process.argv.slice(5)[0];
// 获取可读时间戳 yyyyMMddhhmmss
function getNow() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const second = now.getSeconds();
  return `${year}${pad2(month)}${pad2(day)}${pad2(hour)}${pad2(minute)}${pad2(
    second
  )}`;
}
// 补全两位数字
function pad2(n) {
  return (n < 10 ? "0" : "") + n;
}
module.exports = {
  apps: [
    {
      name: `API_worker_stat`,
      script: "./app.js",
      instances: 1,
      autorestart: true,
      watch: true,
      out_file: `pm2-logs/log_${env}_${getNow()}.log`,
      error_file: `pm2-logs/error_${env}.log`,
      ignore_watch: [
        // 不用监听的文件
        "node_modules",
        "output",
        "pm2-logs",
      ],
      max_memory_restart: "1G",
      env_dev: {
        NODE_ENV: "dev",
        REMOTE_ADDR: "",
      },
      env_test: {
        NODE_ENV: "test",
        REMOTE_ADDR: "",
      },
    },
  ],
};
