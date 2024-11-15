DOCKER_COMPOSE_FILE = ./srcs/docker-compose.yml

all: check_env
	@echo "Starting containers..."
	docker compose -f $(DOCKER_COMPOSE_FILE) up -d

check_env:
	@echo "Checking environment variables..."
	chmod +x check_env.sh
	bash check_env.sh

build: check_env
	@echo "Building and starting containers..."
	docker compose -f $(DOCKER_COMPOSE_FILE) up --build -d

down:
	@echo "Stopping containers..."
	docker compose -f $(DOCKER_COMPOSE_FILE) down

fclean: down
	docker system prune -f -a
	@if [ -n "$$(docker volume ls -q --filter dangling=true)" ]; then \
		docker volume rm $$(docker volume ls -q --filter dangling=true); \
	else \
		echo "No dangling volumes to remove."; \
	fi
	@echo "\033[93mAll the images have been deleted.\033[0m"

re: fclean build

.PHONY: all check_env build down clean fclean re
