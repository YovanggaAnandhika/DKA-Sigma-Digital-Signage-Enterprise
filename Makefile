.PHONY: build push

DOCKER_USER=yovanggaanandhika
BACKEND_IMAGE=$(DOCKER_USER)/dka-sigma:core
FRONTEND_IMAGE=$(DOCKER_USER)/dka-sigma:ui
PLATFORMS=linux/amd64

build:
	@echo "Building local backend image..."
	docker build -t $(BACKEND_IMAGE) ./backend
	@echo "Building local frontend image..."
	docker build -f frontend/Dockerfile -t $(FRONTEND_IMAGE) .

push:
	@echo "Building and pushing backend image..."
	docker buildx build --platform $(PLATFORMS) -t $(BACKEND_IMAGE) --push ./backend
	@echo "Building and pushing frontend image..."
	docker buildx build --platform $(PLATFORMS) -f frontend/Dockerfile -t $(FRONTEND_IMAGE) --push .
