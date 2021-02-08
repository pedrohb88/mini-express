const http = require("http");

class MiniExpress {
	constructor() {
		this._server = http.createServer(this._serverHandler);
		this._routes = { GET: {}, POST: {} };
	}

	_getBody = (req) => {
		return new Promise((resolve, reject) => {
			let body = "";
			req.on("data", (chunk) => {
				body += chunk;
			});

			req.on("end", () => {
				resolve(body);
			});
		});
	};

	_serverHandler = async (req, res) => {
		const body = await this._getBody(req);
		req.body = body;

		res.send = this._send.bind({ res });

		const method = req.method.toUpperCase();
		const routePath = req.url;

		const route = this._getRouteObject(method, routePath);
		if (Object.entries(route).length) {
			for(let i = 0; i < route.handlers.length; i++) {
				const handler = route.handlers[i];

				if(i === route.handlers.length - 1) {
					handler(req, res);
					break;
				}
		
				const handlerExecution = new Promise((resolve, reject) => {
					const next = resolve;
					handler(req, res, next);
				});

				await handlerExecution;
			}

		} else {
			res.end(`Cannot ${method} ${routePath}`);
		}
	};

	_addRoute = (method, route, handlers) => {
		const routeObject = this._getRouteObject(method, route);

		routeObject.handlers = handlers;
	};

	_getRouteObject = (method, route) => {
		const methodRoutes = this._routes[method];

		let routeObject = methodRoutes;
		this._processURL(route).forEach((routePath) => {
			if (!routeObject[routePath]) {
				routeObject[routePath] = {};
			}

			routeObject = routeObject[routePath];
		});
		return routeObject;
	};

	_processURL = (path) => {
		if (path === "/") return ["/"];
		return path.split("/").filter((v) => v.length !== 0);
	};

	listen = (port, hostname, callback) => {
		this._server.listen(port, hostname, callback);
	};

	get = (route, ...handlers) => {
		this._addRoute("GET", route, handlers);
	};

	post = (route, ...handlers) => {
		this._addRoute("POST", route, handlers);
	};

	_send(message) {
		this.res.write(message);
	}
}

module.exports = MiniExpress;
