.PHONY: start build

build: ; docker image build -t omega-data .

start: ; docker container run --publish 8080:8080 --env DEBUG=web,calculator,middleware --env PORT=8080 --detach --name omega-data omega-data