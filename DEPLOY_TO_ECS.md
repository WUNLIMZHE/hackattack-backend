# 🚀 Deploying Web Service to Alibaba Cloud ECS using Docker Compose

This guide explains how to deploy a Node.js backend and Python FastAPI ML service (EBM model) on an Alibaba Cloud ECS instance using Docker Compose.

---

## 🧾 Prerequisites

- You have a running ECS instance with a public IP (e.g., `47.250.150.82`)
- You have your private key file `wunlimzhe.pem`
- Your repo structure looks like this:
hackattack-backend/
├── backend/ # Node.js Express app
│ ├── index.js
│ ├── Dockerfile
│ └── ...
├── ml_service/ # Python FastAPI ML service
│ ├── ebm_api.py
│ ├── Dockerfile
│ └── ...
├── docker-compose.yml
└── .env # ML_API_URL=http://ml:8000

## Deployment Steps:
1. SSH into Your ECS Server.<br/>
```
ssh -i wunlimzhe.pem root@<your-ecs-ip>
```

2. Install Required Packages.<br/>
If using Ubuntu/Debian:
```
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io git curl
```
If using CentOS/RHEL/Alibaba Linux:
```
sudo yum update -y
sudo yum install -y docker git curl
```

3. Install Docker Compose
```
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
 -o /usr/local/bin/docker-compose

sudo chmod +x /usr/local/bin/docker-compose
```

✅ Confirm Installation
```
docker --version
docker-compose --version
git --version
```

4. Set Up SSH Access for GitHub (Private Repo)
4.1 Generate an SSH Key on ECS
```
ssh-keygen -t rsa -b 4096 -C "ecs@github"
```
When you see prompt: Enter file in which to save the key (/root/.ssh/id_rsa):
press enter
After that, you will see:
Enter passphrase (empty for no passphrase):
Enter same passphrase again:
just press Enter twice

4.2 Show your public key to copy it to GitHub
```
cat ~/.ssh/id_rsa.pub
```
Copy the entire output (ssh-rsa AAAA...)

4.3 Add the Key to GitHub
GitHub → Profile → Settings → SSH and GPG Keys -> New SSH key -> Title: Alibaba ECS -> Paste the key -> Click Add SSH Key

4.4 Test GitHub SSH Connection
```
ssh -T git@github.com
```
Expected output:
Hi <your-username>! You've successfully authenticated, but GitHub does not provide shell access.

5. Clone the Repository
```
git clone git@github.com:WUNLIMZHE/hackattack-backend.git
cd hackattack-backend
```

6. Build and Run with Docker Compose
```
docker-compose up --build -d
```

7. Check Running Containers
```
docker ps
```

8. Allow Port Access in Alibaba Cloud
  1) Log into your Alibaba Cloud ECS Console
  2) Go to ECS Security Group
  3) Go to Security Groups section
  4) Click on the Security Group ID/Name
  5) Add an inbound rule:
| Protocol | Port Range | Source    | Description       |
| -------- | ---------- | --------- | ----------------- |
| TCP      | 3000       | 0.0.0.0/0 | Web backend       |
| TCP      | 8000       | 0.0.0.0/0 | (Optional) ML API |

## Redeployment Steps:
1. If you are disconnected from your ECS instance, you need to connect again.
```
ssh -i wunlimzhe.pem root@47.250.150.82
```
1. Else, move to the directory, pull the latest changes from GitHub repository and redeploy.
```
cd hackattack-backend
git pull origin main
docker-compose down
docker-compose up --build -d
```

## Debugging:
1. verify deployment: 
```
docker ps
```
2. Test port connection by sending request through your command prompt:
```
curl -X POST http://localhost:3000/predict-air-monitoring \
  -H "Content-Type: application/json" \
  -d '{"features":[29.8,59.1,5.2,17.9,18.9,9.2,1.72,6.3,319]}'
```