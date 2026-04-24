# Cloud Deployment (AWS/Azure)

## AWS EC2 Deployment

### 1. Create Security Group

```
Name: epicbook-sg
Description: The EpicBook application server

Inbound Rules:
- Type: HTTP    | Port: 80   | Source: 0.0.0.0/0  | Description: Web traffic
- Type: HTTPS   | Port: 443 | Source: 0.0.0.0/0  | Description: Secure web (optional)
- Type: SSH     | Port: 22  | Source: YOUR_IP/32  | Description: Admin access

Outbound Rules:
- All traffic: 0.0.0.0/0 (default)
```

### 2. Launch EC2 Instance

```bash
# Instance specs
- AMI: Ubuntu Server 22.04 LTS (or Amazon Linux 2)
- Instance Type: t3.medium (or t3.small for dev)
- Storage: 20 GB gp3
- Auto-assign public IP: Enabled
```

### 3. SSH to VM and Install Docker

```bash
ssh -i your-key.pem ubuntu@<PUBLIC_IP>

# Install Docker
sudo apt update
sudo apt install -y docker.io docker-compose

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu
newgrp docker

# Enable Docker on boot
sudo systemctl enable docker
```

### 4. Deploy The EpicBook Stack

```bash
# Clone or transfer project files
mkdir -p /opt/epicbook
cd /opt/epicbook

# Create .env file
cat > .env << 'EOF'
MYSQL_ROOT_PASSWORD=your_secure_password
MYSQL_DATABASE=bookstore
MYSQL_USER=epicbook_user
MYSQL_PASSWORD=your_secure_password
NODE_ENV=production
PORT=8080
ALLOWED_ORIGINS=http://<PUBLIC_IP>
EOF

# Copy project files (docker-compose.yml, backend/, frontend/, proxy/, db/)
# Then start the stack
docker-compose up -d

# Check status
docker-compose ps
docker ps
```

## Azure VM Deployment

### 1. Create Network Security Group (NSG)

```
Name: epicbook-nsg

Inbound Security Rules:
- Priority: 100 | Port: 80   | Action: Allow | Source: Internet
- Priority: 110 | Port: 443 | Action: Allow | Source: Internet
- Priority: 120 | Port: 22  | Action: Allow | Source: YOUR_IP
```

### 2. Create Virtual Machine

```
- Image: Ubuntu 22.04 LTS
- Size: Standard_D2s_v3 (or smaller for dev)
- Authentication: SSH key
- Public IP: Enabled
- NIC NSG: epicbook-nsg
```

### 3. Install Docker on Azure VM

```bash
# SSH to the VM
ssh -i your-key.pem azureuser@<PUBLIC_IP>

# Same Docker installation steps as AWS
```

## Deployment Validation

### Test 1: Public Access
```bash
# Open browser to http://<PUBLIC_IP>
curl -I http://<PUBLIC_IP>
```

Expected: HTTP 200 from nginx

### Test 2: API Health
```bash
curl http://<PUBLIC_IP>/health
curl http://<PUBLIC_IP>/api/cart
```

### Test 3: Data Persistence
```bash
# Add something via the app, then restart
docker-compose restart

# Verify data still exists
curl http://<PUBLIC_IP>/api/cart
```

### Test 4: Volume Persistence
```bash
# Check volumes exist
docker volume ls | grep epicbook

# Restart entire stack (down + up)
docker-compose down
docker-compose up -d

# Verify database data intact
docker-compose exec db mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "USE bookstore; SHOW TABLES;"
```

## Security Checklist

- [ ] Only ports 80/443 (and 22 for SSH) are open
- [ ] SSH restricted to specific IP (or use VPN)
- [ ] No secrets committed to git
- [ ] `.env` file not in version control
- [ ] Docker daemon not exposed via TCP
- [ ] Regular security updates applied

## Scaling Considerations

For future scaling:
- Add Application Load Balancer
- Use RDS MySQL instead of container DB
- Store uploads in S3
- Consider container orchestration (ECS/EKS/ACR)