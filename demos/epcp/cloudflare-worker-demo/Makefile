default: dist
.PHONY: default watch cloudflare-worker-upload server cloudflare

SRCS = $(wildcard ./src/*.js)

node_modules: package.json
	npm install
	touch $@

dist: node_modules $(SRCS)
	npm run make:dist
	touch $@

watch:
	npm run watch

cloudflare-worker-upload: dist
	./etc/cloudflare/upload-webworker.sh dist/pubcontrol-browser-demo.cloudflareworker.js

cloudflare: cloudflare-worker-upload

server: dist
	npm run http-server
