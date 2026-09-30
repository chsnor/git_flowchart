FROM node:20-alpine AS base

WORKDIR /app

# ติดตั้ง dependencies
COPY package.json package-lock.json ./
RUN npm ci

# คัดลอกโค้ดทั้งหมด
COPY . .

# สั่ง build หน้าเว็บ Next.js
RUN npm run build

# รันระบบในโหมด Production
EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

CMD ["npm", "start"]
