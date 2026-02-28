# Production Deployment Guide

## Prerequisites

- MongoDB installed and running on EC2 instance
- MongoDB authentication enabled
- PM2 installed globally on EC2 (`npm install -g pm2`)
- GitHub repository secrets configured:
  - `EC2_HOST` - Your EC2 instance IP/hostname
  - `EC2_USER` - EC2 username (e.g., ec2-user)
  - `EC2_SSH_KEY` - SSH private key for EC2 access

## EC2 Setup (One-time)

### 1. Create Project Directory

```bash
mkdir -p /home/ec2-user/projects/admin-server
mkdir -p /home/ec2-user/projects/admin-server/logs
```

### 2. Create PM2 Ecosystem File

Create `/home/ec2-user/projects/admin-server/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: "admin-server",
      script: "./dist/admin-server",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        MONGODB_URI: "mongodb://shop-db-user:pass123@localhost:27017/my-shop-db?authSource=admin",
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      max_restarts: 5,
      min_uptime: "10s",
    },
  ],
};
```

**Security Note**: This file contains sensitive credentials and should:
- Never be committed to Git
- Have restricted permissions: `chmod 600 ecosystem.config.js`
- Be backed up securely

### 3. Initial PM2 Start

```bash
cd /home/ec2-user/projects/admin-server
pm2 start ecosystem.config.js
pm2 save
```

### 4. Setup PM2 Startup Script

```bash
pm2 startup systemd
# Run the command that PM2 outputs (usually requires sudo)
```

## Deployment

The deployment happens automatically via GitHub Actions when you push to the `main` branch.

### Workflow Steps:

1. **Build** - Compiles the TypeScript app into a binary
2. **Copy** - SCP the binary to EC2 (`/home/ec2-user/projects/admin-server/dist/`)
3. **Deploy** - Reloads PM2 with the new binary using the ecosystem config

### Manual Deployment (if needed)

```bash
# On your local machine
bun run build

# Copy to EC2 (replace with your EC2 details)
scp dist/admin-server ec2-user@your-ec2-ip:/home/ec2-user/projects/admin-server/dist/

# On EC2
pm2 reload ecosystem.config.js --update-env
```

## Troubleshooting

### Check PM2 Status
```bash
pm2 status
pm2 logs admin-server
pm2 logs admin-server --lines 100
```

### Check MongoDB Connection
```bash
# Test connection from EC2
mongosh "mongodb://shop-db-user:pass123@localhost:27017/my-shop-db?authSource=admin"
```

### Restart Application
```bash
pm2 restart admin-server
# or
pm2 reload ecosystem.config.js
```

### View Environment Variables
```bash
pm2 env admin-server
```

## Security Considerations

1. **ecosystem.config.js** contains database credentials - keep it secure
2. **MongoDB** should only accept connections from localhost (bind to 127.0.0.1)
3. **EC2 Security Group** should only open port 3000 (app), not 27017 (MongoDB)
4. **Rotate passwords** periodically
5. **Use strong passwords** for MongoDB users

## Updating Environment Variables

If you need to update env vars (e.g., change MongoDB password):

1. Edit `/home/ec2-user/projects/admin-server/ecosystem.config.js` on EC2
2. Run: `pm2 reload ecosystem.config.js --update-env`
3. Run: `pm2 save`

## Logs

- Application logs: `/home/ec2-user/projects/admin-server/logs/`
- PM2 logs: `~/.pm2/logs/`
- View logs: `pm2 logs admin-server`
