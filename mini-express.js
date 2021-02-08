const http = require("http");

class MiniExpress {

	//_server: holds the http server itself
	//_routes: tree like structure to store the existing routes and their handlers
	constructor() {
		this._server = http.createServer(this._serverHandler);
		this._routes = { GET: {}, POST: {} };
	}

	//parses the body data stream as plain text
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

	//handle every request made to the http server
	_serverHandler = async (req, res) => {

		//1. parse body
		const body = await this._getBody(req);
		req.body = body;

		//2. incorporate additional request/response methods
		res.send = this._send.bind({ res });

		//3. find the requested route
		const method = req.method.toUpperCase();
		const routePath = req.url;

		const route = this._getRouteObject(method, routePath);
		if (Object.entries(route).length) {

			//4. executes each middleware and final handler of the requested route
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

	//create or find and update the specified route object
	_addRoute = (method, route, handlers) => {
		const routeObject = this._getRouteObject(method, route);

		routeObject.handlers = handlers;
	};

	//return the specified route object
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

	//process incoming url into array of sub paths
	_processURL = (path) => {
		if (path === "/") return ["/"];
		return path.split("/").filter((v) => v.length !== 0);
	};

	//call the http server listen method
	listen = (port, hostname, callback) => {
		this._server.listen(port, hostname, callback);
	};

	//create a new GET route
	get = (route, ...handlers) => {
		this._addRoute("GET", route, handlers);
	};

	//create a new POST route
	post = (route, ...handlers) => {
		this._addRoute("POST", route, handlers);
	};

	//write data to response
	_send(message) {
		this.res.write(message);
	}
}

module.exports = MiniExpress;
