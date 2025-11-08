FROM tailscale/tailscale:latest

# Install Nginx and download gost binary
RUN apk add --no-cache nginx curl && \
    curl -L https://github.com/go-gost/gost/releases/download/v3.0.0-rc10/gost_3.0.0-rc10_linux_amd64v3.tar.gz | tar -xz -C /tmp && \
    mv /tmp/gost /usr/local/bin/gost && \
    chmod +x /usr/local/bin/gost

# Copy Nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]
