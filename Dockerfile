# Use official Nginx image as base
FROM nginx:alpine

# Copy all project files to Nginx default HTML directory
COPY . /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
