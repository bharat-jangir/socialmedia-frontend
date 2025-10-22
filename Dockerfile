# ---------- Build stage ----------
    FROM node:18-alpine AS builder

    WORKDIR /app
    COPY package*.json ./
    RUN npm ci --only=production
    COPY . .
    RUN npm run build
    
    # ---------- Production stage ----------
    FROM nginx:alpine
    
    # Copy built app
    COPY --from=builder /app/dist /usr/share/nginx/html
    
    # Copy nginx configuration
    COPY nginx.conf /etc/nginx/conf.d/default.conf
    
    # Prepare directories & permissions
    RUN mkdir -p /usr/share/nginx/html/carousel-images && \
        chmod -R 755 /usr/share/nginx/html
    
    # Expose Render's dynamic port
    EXPOSE 10000
    
    # Run nginx in foreground
    CMD ["nginx", "-g", "daemon off;"]
    