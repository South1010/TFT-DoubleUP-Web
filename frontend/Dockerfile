FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

ENV NEXT_PUBLIC_ENABLE_ADMIN=true
ENV BACKEND_INTERNAL_URL=http://backend:8000
ENV NODE_ENV=production
ENV PORT=3000

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
