# Welcome to your Lovable project

TODO: Document your project here

---

## 🚀 DevOps & Containerization

This is a Frontend application built with Vite, React, and TypeScript. It is containerized for deployment on AWS App Runner using a multi-stage Docker build.

### Local Development with Docker

#### Build the Docker Image

```bash
docker build -t picode-hub .
```

#### Run the Container Locally

```bash
docker run -p 8080:8080 picode-hub
```

The application will be available at `http://localhost:8080`.

### AWS ECR & App Runner Deployment

#### Prerequisites

- AWS CLI configured with appropriate credentials
- An ECR repository created in your AWS account

#### Step-by-Step Deployment

**1. Authenticate Docker with AWS ECR**

```bash
aws ecr get-login-password --region <your-aws-region> | docker login --username AWS --password-stdin <your-account-id>.dkr.ecr.<your-aws-region>.amazonaws.com
```

**2. Build and Tag the Image**

```bash
docker build -t picode-hub .
docker tag picode-hub:latest <your-account-id>.dkr.ecr.<your-aws-region>.amazonaws.com/picode-hub:latest
```

**3. Push to ECR**

```bash
docker push <your-account-id>.dkr.ecr.<your-aws-region>.amazonaws.com/picode-hub:latest
```

#### Configure AWS App Runner

When setting up your service in AWS App Runner:

⚠️ **Important:**

- Point the service to the ECR image: `<your-account-id>.dkr.ecr.<your-aws-region>.amazonaws.com/picode-hub:latest`
- The container **must** expose **port 8080** (this is a requirement for App Runner)
- The Dockerfile is already configured to expose port 8080 and route traffic correctly through Nginx

The application will automatically be deployed and accessible through your App Runner service URL.
