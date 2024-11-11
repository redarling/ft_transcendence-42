DOCKER_COMPOSE_FILE = ./srcs/docker-compose.yml

all: check_env
	@echo "Starting containers..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) up -d

check_env:
	@echo "Checking environment variables..."
	chmod +x check_env.sh
	bash check_env.sh

build: check_env
	@echo "Building and starting containers..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) up --build -d

down:
	@echo "Stopping containers..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) down

clean:
	@echo "Stopping containers..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) down

fclean: clean
	@echo "Removing all volumes and networks..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) down -v
	@docker system prune -f --volumes

re: fclean build

.PHONY: all check_env build down clean fclean re
